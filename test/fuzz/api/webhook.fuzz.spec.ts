// webhook.fuzz.spec.ts: arbitrary payloads, headers and signed bodies never crash the webhook.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { parseWebhook } from '../../../apps/api/src/meta/parse.ts';
import { verifySignature } from '../../../apps/api/src/meta/signature.ts';
import { signedPost, testApp, textMsg, metaBody } from '../../api-helpers.ts';

const messageLike = fc.record(
  {
    id: fc.oneof(fc.string(), fc.integer()),
    from: fc.oneof(fc.string(), fc.constant(null)),
    timestamp: fc.oneof(fc.string(), fc.integer()),
    type: fc.constantFrom('text', 'interactive', 'button', 'image', 'reaction', 'unknown'),
    text: fc.oneof(fc.record({ body: fc.string({ maxLength: 6000 }) }), fc.anything()),
    interactive: fc.anything(),
    button: fc.anything(),
  },
  { requiredKeys: [] },
);

describe('webhook (fuzz)', () => {
  it('parseWebhook never throws and emits only bounded, well-formed messages', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.anything(),
          fc.array(messageLike, { maxLength: 5 }).map((ms) => JSON.parse(metaBody(ms))),
        ),
        (payload) => {
          for (const m of parseWebhook(payload)) {
            expect(typeof m.id).toBe('string');
            expect(typeof m.from).toBe('string');
            if (m.inbound.kind === 'text') expect(m.inbound.text.length).toBeLessThanOrEqual(4096);
            else expect(m.inbound.id.length).toBeLessThanOrEqual(256);
          }
        },
      ),
      { numRuns: 2000 },
    );
  });

  it('verifySignature never throws on arbitrary headers', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ maxLength: 500 }),
        fc.string(),
        fc.string({ minLength: 1 }),
        (body, header, secret) => {
          const r = verifySignature(Buffer.from(body), header, secret);
          expect(['ok', 'mismatch', 'missing_header']).toContain(r);
          if (!header.startsWith('sha256=')) expect(r).toBe('missing_header');
        },
      ),
      { numRuns: 2000 },
    );
  });

  it('a signed webhook with arbitrary messages never answers 5xx', async () => {
    const { app } = await testApp();
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.oneof(
            messageLike,
            fc.string().map((t) => textMsg(t || 'x', '57300', t)),
          ),
          { maxLength: 4 },
        ),
        async (ms) => {
          const res = await app.inject(signedPost(metaBody(ms)));
          expect(res.statusCode).toBe(200);
        },
      ),
      { numRuns: 300 },
    );
    await app.inbox.idle();
  });

  it('arbitrary raw bodies with a valid signature never answer 5xx', async () => {
    const { app } = await testApp();
    await fc.assert(
      fc.asyncProperty(fc.string({ maxLength: 300 }), async (raw) => {
        const res = await app.inject(signedPost(raw));
        expect(res.statusCode).toBeLessThan(500);
      }),
      { numRuns: 300 },
    );
    await app.inbox.idle();
  });
});
