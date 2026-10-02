// arbitraries.ts: fast-check generators shared by the fuzz and invariant suites.
import fc from 'fast-check';
import { INTENT_KINDS, type ConversationState, type Inbound } from '@audiorapy/domain';

export const iso = fc
  .date({ min: new Date('2026-01-01'), max: new Date('2027-12-31'), noInvalidDate: true })
  .map((d) => d.toISOString());

export const stateArb: fc.Arbitrary<ConversationState> = fc.oneof(
  fc.constant({ step: 'new' as const }),
  fc.constant({ step: 'awaiting_consent' as const }),
  fc.constant({ step: 'declined' as const }),
  fc.record({
    step: fc.constant('choosing_slot' as const),
    offered: fc.array(iso, { maxLength: 12 }),
  }),
  fc.record({ step: fc.constant('booked' as const), startsAt: iso }),
);

export const inboundArb: fc.Arbitrary<Inbound> = fc.oneof(
  fc.record({ kind: fc.constant('text' as const), text: fc.string({ maxLength: 300 }) }),
  fc.record({
    kind: fc.constant('button' as const),
    id: fc.oneof(
      fc.string(),
      fc.constantFrom(
        'consent:yes',
        'consent:no',
        'slot:other',
        'appt:confirm',
        'appt:cancel',
        'appt:reschedule',
        'appt:keep',
      ),
      iso.map((d) => `slot:${d}`),
    ),
  }),
);

export const intentArb = fc.record({
  kind: fc.constantFrom(...INTENT_KINDS),
});
