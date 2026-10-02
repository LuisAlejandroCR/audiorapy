// signature-parse.spec.ts: raw-byte HMAC verification and webhook payload normalization.
import { describe, expect, it } from 'vitest';
import { sign, verifySignature } from '../../../apps/api/src/meta/signature.ts';
import { parseWebhook } from '../../../apps/api/src/meta/parse.ts';
import { buttonMsg, metaBody, metaEscape, textMsg } from '../../api-helpers.ts';

describe('verifySignature', () => {
  const body = Buffer.from(metaEscape(metaBody([textMsg('m1', '57300', 'Sí, mañana está bien')])));

  it('accepts a signature over the exact raw bytes, accents escaped as Meta does', () => {
    expect(verifySignature(body, sign(body, 'k'), 'k')).toBe('ok');
  });

  it('rejects a signature computed over re-serialized JSON', () => {
    const reserialized = JSON.stringify(JSON.parse(body.toString()));
    expect(verifySignature(body, sign(reserialized, 'k'), 'k')).toBe('mismatch');
  });

  it('fails closed without secret, body or header', () => {
    expect(verifySignature(body, sign(body, 'k'), undefined)).toBe('missing_secret');
    expect(verifySignature(undefined, sign(body, 'k'), 'k')).toBe('missing_body');
    expect(verifySignature(body, undefined, 'k')).toBe('missing_header');
    expect(verifySignature(body, 'sha256=zz', 'k')).toBe('mismatch');
  });
});

describe('parseWebhook', () => {
  it('normalizes text, button replies, list replies and template buttons', () => {
    const list = {
      id: 'm3',
      from: 'BSUID.abc',
      type: 'interactive',
      interactive: { type: 'list_reply', list_reply: { id: 'slot:2026-10-05T13:00:00.000Z' } },
    };
    const tpl = {
      id: 'm4',
      from: '57300',
      type: 'button',
      button: { payload: 'appt:confirm', text: 'Confirmar' },
    };
    const msgs = parseWebhook(
      JSON.parse(
        metaBody([
          textMsg('m1', '57300', 'Hola'),
          buttonMsg('m2', '57300', 'consent:yes'),
          list,
          tpl,
        ]),
      ),
    );
    expect(msgs.map((m) => [m.id, m.from, m.inbound])).toEqual([
      ['m1', '57300', { kind: 'text', text: 'Hola' }],
      ['m2', '57300', { kind: 'button', id: 'consent:yes' }],
      ['m3', 'BSUID.abc', { kind: 'button', id: 'slot:2026-10-05T13:00:00.000Z' }],
      ['m4', '57300', { kind: 'button', id: 'appt:confirm' }],
    ]);
  });

  it('ignores status updates, other fields, media and garbage', () => {
    const statusOnly = {
      entry: [
        { changes: [{ field: 'messages', value: { statuses: [{ id: 's1', status: 'read' }] } }] },
      ],
    };
    const otherField = {
      entry: [
        { changes: [{ field: 'account_update', value: { messages: [textMsg('x', '1', 'hi')] } }] },
      ],
    };
    const image = JSON.parse(
      metaBody([{ id: 'i1', from: '57300', type: 'image', image: { id: 'media' } }]),
    );
    expect(parseWebhook(statusOnly)).toEqual([]);
    expect(parseWebhook(otherField)).toEqual([]);
    expect(parseWebhook(image)).toEqual([]);
    expect(parseWebhook('nope')).toEqual([]);
    expect(parseWebhook(null)).toEqual([]);
  });
});
