// channels.spec.ts: Meta payload mapping, plain-text degradation and the Meta channel against a fake Graph API.
import { describe, expect, it } from 'vitest';
import { consentRequest, help, slotList } from '@audiorapy/domain';
import { toMetaPayload, toPlainText } from '../../../apps/api/src/channel/payload.ts';
import { MetaChannel } from '../../../apps/api/src/channel/meta-channel.ts';
import { catalogue, slot } from '../../helpers.ts';
import { fakeFetch } from '../../api-helpers.ts';

describe('payload', () => {
  it('maps buttons to an interactive button message', () => {
    const p = toMetaPayload('57300', consentRequest(catalogue)) as {
      type: string;
      interactive: { type: string; action: { buttons: unknown[] } };
    };
    expect(p.type).toBe('interactive');
    expect(p.interactive.type).toBe('button');
    expect(p.interactive.action.buttons).toEqual([
      { type: 'reply', reply: { id: 'consent:yes', title: 'Acepto' } },
      { type: 'reply', reply: { id: 'consent:no', title: 'No acepto' } },
    ]);
  });

  it('maps a slot list to one section with ids preserved', () => {
    const p = toMetaPayload('57300', slotList([slot('2026-10-05T13:00:00.000Z')], true)) as {
      interactive: { action: { sections: Array<{ rows: Array<{ id: string }> }> } };
    };
    expect(p.interactive.action.sections[0]!.rows.map((r) => r.id)).toEqual([
      'slot:2026-10-05T13:00:00.000Z',
      'slot:other',
    ]);
  });

  it('degrades to numbered plain text', () => {
    expect(toPlainText(consentRequest(catalogue))).toContain('1. Acepto\n2. No acepto');
    expect(toMetaPayload('57300', help())).toMatchObject({ type: 'text' });
  });
});

describe('MetaChannel', () => {
  const opts = { accessToken: 'tok', phoneNumberId: '123', graphVersion: 'v25.0' };

  it('posts to the Graph API with the bearer token and returns the message id', async () => {
    let seen: { url: string; auth: string | null } | null = null;
    const ch = new MetaChannel({
      ...opts,
      fetchImpl: fakeFetch((url, init) => {
        seen = { url, auth: new Headers(init.headers).get('authorization') };
        return Response.json({ messages: [{ id: 'wamid.1' }] });
      }),
    });
    expect(await ch.send('57300', help(), 'k1')).toMatchObject({
      available: true,
      data: { id: 'wamid.1' },
    });
    expect(seen).toEqual({
      url: 'https://graph.facebook.com/v25.0/123/messages',
      auth: 'Bearer tok',
    });
  });

  it('retries an interactive message rejected with 400 as plain text', async () => {
    const types: string[] = [];
    const ch = new MetaChannel({
      ...opts,
      fetchImpl: fakeFetch((_url, init) => {
        const body = JSON.parse(String(init.body)) as { type: string };
        types.push(body.type);
        return body.type === 'interactive'
          ? new Response('{}', { status: 400 })
          : Response.json({ messages: [{ id: 'wamid.2' }] });
      }),
    });
    expect((await ch.send('57300', consentRequest(catalogue), 'k2')).available).toBe(true);
    expect(types).toEqual(['interactive', 'text']);
  });

  it('degrades on 5xx, network errors and timeouts instead of throwing', async () => {
    const down = new MetaChannel({
      ...opts,
      fetchImpl: fakeFetch(() => new Response('', { status: 503 })),
    });
    expect(await down.send('1', help(), 'a')).toMatchObject({
      available: false,
      error: 'meta responded 503',
    });
    const offline = new MetaChannel({
      ...opts,
      fetchImpl: fakeFetch(() => Promise.reject(new TypeError('fetch failed'))),
    });
    expect(await offline.send('1', help(), 'b')).toMatchObject({
      available: false,
      error: 'fetch failed',
    });
    const slow = new MetaChannel({
      ...opts,
      timeoutMs: 20,
      fetchImpl: fakeFetch(() => new Promise<Response>(() => {})),
    });
    expect(await slow.send('1', help(), 'c')).toMatchObject({
      available: false,
      error: 'timeout after 20ms',
    });
  });

  it('does not send twice for the same idempotency key', async () => {
    let calls = 0;
    const ch = new MetaChannel({
      ...opts,
      fetchImpl: fakeFetch(() => (calls++, Response.json({ messages: [{ id: 'w' }] }))),
    });
    await ch.send('1', help(), 'same');
    await ch.send('1', help(), 'same');
    expect(calls).toBe(1);
  });
});
