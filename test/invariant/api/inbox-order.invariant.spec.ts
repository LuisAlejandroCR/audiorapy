// inbox-order.invariant.spec.ts: messages that arrive together (one webhook batch, or deliveries that
// overlap) leave every family exactly where handling them one by one, in order, would.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { Inbox } from '../../../apps/api/src/service/inbox.ts';
import { ConsoleChannel } from '../../../apps/api/src/channel/console-channel.ts';
import { FallbackIntentClassifier } from '../../../apps/api/src/ai/rules-intent.ts';
import { FallbackRisk } from '../../../apps/api/src/ai/risk.ts';
import { MemoryStore } from '../../../apps/api/src/store/memory-store.ts';
import { BUTTON_IDS, type Inbound } from '@audiorapy/domain';
import { catalogue, THURSDAY_8AM } from '../../helpers.ts';

const CONTACTS = ['573001110001', '573001110002'];

function inbox() {
  const store = new MemoryStore();
  const channel = new ConsoleChannel();
  const box = new Inbox({
    store,
    channel,
    classifier: new FallbackIntentClassifier(null),
    catalogue,
    risk: new FallbackRisk(null),
    now: () => THURSDAY_8AM,
  });
  return { store, channel, box };
}

const inboundArb: fc.Arbitrary<Inbound> = fc.oneof(
  fc
    .constantFrom('Hola', 'mejor el miércoles en la tarde', 'el lunes en la mañana', 'gracias')
    .map((text) => ({ kind: 'text' as const, text })),
  fc.constantFrom(...Object.values(BUTTON_IDS)).map((id) => ({ kind: 'button' as const, id })),
);

async function observe(t: ReturnType<typeof inbox>) {
  return Promise.all(
    CONTACTS.map(async (c) => ({
      state: await t.store.getConversation(c),
      sent: t.channel.outbox.filter((o) => o.to === c).map((o) => o.message),
    })),
  );
}

describe('inbox ordering invariants', () => {
  it('a batch of messages ends where one-by-one handling in arrival order ends', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.tuple(fc.nat(CONTACTS.length - 1), inboundArb), { minLength: 2, maxLength: 8 }),
        async (events) => {
          const messages = events.map(([c, inbound], i) => ({
            id: `m${i}`,
            from: CONTACTS[c]!,
            timestamp: 0,
            inbound,
          }));
          const sequential = inbox();
          for (const m of messages) await sequential.box.handle(m);
          const batched = inbox();
          for (const m of messages) batched.box.enqueue(m);
          await batched.box.idle();
          expect(await observe(batched)).toEqual(await observe(sequential));
        },
      ),
      { numRuns: 300 },
    );
  });
});
