// webhook.invariant.spec.ts: properties of the webhook for every input.
// Signature: only the exact bytes under the right secret verify. A2: every message id has its effects
// once, however often it is redelivered. Privacy: logs never carry caregiver text or phone numbers.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { sign, verifySignature } from '../../../apps/api/src/meta/signature.ts';
import { Inbox } from '../../../apps/api/src/service/inbox.ts';
import { ConsoleChannel } from '../../../apps/api/src/channel/console-channel.ts';
import { FallbackIntentClassifier } from '../../../apps/api/src/ai/rules-intent.ts';
import { MemoryStore } from '../../../apps/api/src/store/memory-store.ts';
import { BUTTON_IDS, type Inbound } from '@audiorapy/domain';
import { catalogue, THURSDAY_8AM } from '../../helpers.ts';

function inbox() {
  const store = new MemoryStore();
  const channel = new ConsoleChannel();
  const logs: string[] = [];
  const box = new Inbox({
    store,
    channel,
    classifier: new FallbackIntentClassifier(null),
    catalogue,
    riskEnabled: true,
    now: () => THURSDAY_8AM,
    log: (event, fields) => logs.push(JSON.stringify({ event, ...fields })),
  });
  return { store, channel, box, logs };
}

const inboundArb: fc.Arbitrary<Inbound> = fc.oneof(
  fc.string({ maxLength: 60 }).map((text) => ({ kind: 'text' as const, text })),
  fc.constantFrom(...Object.values(BUTTON_IDS)).map((id) => ({ kind: 'button' as const, id })),
);

describe('signature invariants', () => {
  it('sign/verify round-trips; flipping any byte or using another secret fails', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 1, maxLength: 400 }),
        fc.string({ minLength: 1 }),
        fc.nat(),
        fc.string({ minLength: 1 }),
        (bytes, secret, at, other) => {
          const body = Buffer.from(bytes);
          const header = sign(body, secret);
          expect(verifySignature(body, header, secret)).toBe('ok');
          const flipped = Buffer.from(body);
          flipped[at % flipped.length]! ^= 0x01;
          expect(verifySignature(flipped, header, secret)).toBe('mismatch');
          fc.pre(other !== secret);
          expect(verifySignature(body, header, other)).toBe('mismatch');
        },
      ),
      { numRuns: 1000 },
    );
  });
});

describe('inbox invariants', () => {
  it('A2: redelivering any message any number of times sends exactly what one delivery sends', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.tuple(inboundArb, fc.integer({ min: 1, max: 4 })), {
          minLength: 1,
          maxLength: 8,
        }),
        async (events) => {
          const once = inbox();
          const many = inbox();
          for (const [i, [inbound, copies]] of events.entries()) {
            const m = { id: `m${i}`, from: '57300', timestamp: 0, inbound };
            await once.box.handle(m);
            for (let c = 0; c < copies; c++) await many.box.handle(m);
          }
          expect(many.channel.outbox.map((o) => o.message)).toEqual(
            once.channel.outbox.map((o) => o.message),
          );
          expect(many.store.listAppointments().length).toBe(once.store.listAppointments().length);
          expect(many.store.listConsents().length).toBe(once.store.listConsents().length);
        },
      ),
      { numRuns: 300 },
    );
  });

  it('logs never contain caregiver text or the phone number', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 40 }), { minLength: 1, maxLength: 6 }),
        async (texts) => {
          const { box, logs } = inbox();
          const phone = '573009998877';
          for (const [i, t] of texts.entries())
            await box.handle({
              id: `m${i}`,
              from: phone,
              timestamp: 0,
              inbound: { kind: 'text', text: `MARK${t}MARK` },
            });
          await box.handle({
            id: 'yes',
            from: phone,
            timestamp: 0,
            inbound: { kind: 'button', id: BUTTON_IDS.consentYes },
          });
          const all = logs.join('\n');
          expect(all).not.toContain('MARK');
          expect(all).not.toContain(phone);
        },
      ),
      { numRuns: 300 },
    );
  });
});
