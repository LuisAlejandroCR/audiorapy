// app.spec.ts: the HTTP surface — handshake, signed webhook, dedupe, provider health, dashboard auth,
// the simulator, and booking with the model down.
import { describe, expect, it } from 'vitest';
import { OllamaIntentClassifier } from '../../../apps/api/src/ai/ollama-intent.ts';
import {
  buttonMsg,
  DASH,
  fakeFetch,
  metaBody,
  metaEscape,
  signedPost,
  testApp,
  textMsg,
  VERIFY,
} from '../../api-helpers.ts';

describe('webhook handshake', () => {
  it('echoes the challenge for the right token and 403s a wrong one', async () => {
    const { app } = await testApp();
    const ok = await app.inject({
      url: `/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY}&hub.challenge=1234`,
    });
    expect([ok.statusCode, ok.body]).toEqual([200, '1234']);
    expect(
      (
        await app.inject({
          url: '/webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=1',
        })
      ).statusCode,
    ).toBe(403);
  });

  it('fails closed when no verify token is configured', async () => {
    const { app } = await testApp({ env: { META_VERIFY_TOKEN: '' } });
    expect(
      (await app.inject({ url: '/webhook?hub.mode=subscribe&hub.verify_token=&hub.challenge=1' }))
        .statusCode,
    ).toBe(503);
  });
});

describe('webhook POST', () => {
  it('A1: rejects unsigned and wrongly signed bodies', async () => {
    const { app, channel } = await testApp();
    const body = metaBody([textMsg('m1', '57300', 'Hola')]);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/webhook',
          headers: { 'content-type': 'application/json' },
          payload: body,
        })
      ).statusCode,
    ).toBe(401);
    expect((await app.inject(signedPost(body, 'other-secret'))).statusCode).toBe(401);
    await app.inbox.idle();
    expect(channel.outbox).toHaveLength(0);
  });

  it('returns 503 when the app secret is missing (fail closed, visible)', async () => {
    const { app } = await testApp({ env: { META_APP_SECRET: '' } });
    expect((await app.inject(signedPost(metaBody([])))).statusCode).toBe(503);
  });

  it('accepts a signed body with accented text escaped the way Meta sends it', async () => {
    const { app, channel } = await testApp();
    const res = await app.inject(
      signedPost(metaEscape(metaBody([textMsg('m1', '57300', '¡Hola! ¿Cómo están?')]))),
    );
    expect(res.json()).toEqual({ received: 1 });
    await app.inbox.idle();
    expect(channel.sentTo('57300')[0]?.key).toBe('consent_request');
  });

  it('A2: the same message id delivered twice is processed once', async () => {
    const { app, channel, store } = await testApp();
    const body = metaBody([textMsg('dup-1', '57300', 'Hola')]);
    await app.inject(signedPost(body));
    await app.inject(signedPost(body));
    await app.inbox.idle();
    expect(channel.sentTo('57300')).toHaveLength(1);
    expect((await store.getConversation('57300')).step).toBe('awaiting_consent');
  });

  it('answers 400 to malformed JSON and 200 to an empty, signed probe', async () => {
    const { app } = await testApp();
    expect((await app.inject(signedPost('{not json'))).statusCode).toBe(400);
    expect((await app.inject(signedPost(metaBody([])))).json()).toEqual({ received: 0 });
  });
});

describe('end to end through the webhook', () => {
  it('A3 + A4: with Ollama down, consent → slots → booking still works by buttons', async () => {
    const down = new OllamaIntentClassifier({
      baseUrl: 'http://ollama.test',
      model: 'gemma4:e4b',
      timeoutMs: 50,
      fetchImpl: fakeFetch(() => Promise.reject(new Error('ECONNREFUSED'))),
    });
    const { app, channel, store } = await testApp({ primary: down });
    const send = async (m: unknown) => {
      await app.inject(signedPost(metaBody([m])));
      await app.inbox.idle();
    };
    await send(textMsg('a', '57300', 'Hola, quiero agendar'));
    expect(channel.sentTo('57300').at(-1)?.key).toBe('consent_request');
    await send(textMsg('b', '57300', 'sí'));
    expect(channel.sentTo('57300').at(-1)?.key).toBe('consent_request');
    await send(buttonMsg('c', '57300', 'consent:yes'));
    const list = channel.sentTo('57300').at(-1);
    expect(list?.type).toBe('list');
    // The second offer is days away, so its day-before reminder is still in the future.
    const chosenSlot = list?.type === 'list' ? list.rows[1]!.id : '';
    await send(buttonMsg('d', '57300', chosenSlot));
    expect(channel.sentTo('57300').at(-1)?.key).toBe('booked');
    expect(await store.listAppointments()).toHaveLength(1);
    expect((await store.listJobs()).map((j) => j.kind)).toContain('day_before');
    const health = (await app.inject({ url: '/health/providers' })).json();
    expect(health.intent).toMatchObject({
      configured: 'rules',
      active: 'ollama:gemma4:e4b',
      last: { available: false, error: 'ECONNREFUSED' },
    });
  });
});

describe('dashboard api', () => {
  it('requires the bearer token and masks phone numbers', async () => {
    const { app, store } = await testApp();
    await store.createAppointment(
      '573001112233',
      '2026-10-05T13:00:00.000Z',
      '2026-10-05T13:45:00.000Z',
      new Date(),
    );
    expect((await app.inject({ url: '/api/agenda' })).statusCode).toBe(401);
    expect(
      (await app.inject({ url: '/api/agenda', headers: { authorization: 'Bearer wrong' } }))
        .statusCode,
    ).toBe(401);
    const res = await app.inject({
      url: '/api/agenda',
      headers: { authorization: `Bearer ${DASH}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toContain('573001112233');
    expect(res.json().appointments[0]).toMatchObject({
      contact: '••••2233',
      label: 'lun 5 oct · 8:00 a. m.',
    });
  });

  it('is disabled without a configured token', async () => {
    const { app } = await testApp({ env: { DASHBOARD_TOKEN: '' } });
    expect(
      (await app.inject({ url: '/api/agenda', headers: { authorization: 'Bearer ' } })).statusCode,
    ).toBe(503);
  });
});

describe('dev simulator', () => {
  it('drives the same pipeline and returns the replies', async () => {
    const { app } = await testApp();
    const r = await app.inject({
      method: 'POST',
      url: '/dev/simulate',
      payload: { from: '57300', text: 'Hola' },
    });
    expect(r.json()).toMatchObject({
      duplicate: false,
      state: { step: 'awaiting_consent' },
      replies: [{ key: 'consent_request' }],
    });
    expect(
      (await app.inject({ method: 'POST', url: '/dev/simulate', payload: { from: '57300' } }))
        .statusCode,
    ).toBe(400);
  });

  it('does not exist in production or with the Meta channel', async () => {
    const prod = await testApp({ env: { NODE_ENV: 'production' } });
    expect(
      (
        await prod.app.inject({
          method: 'POST',
          url: '/dev/simulate',
          payload: { from: '57300', text: 'x' },
        })
      ).statusCode,
    ).toBe(404);
  });
});
