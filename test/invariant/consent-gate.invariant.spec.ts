// consent-gate.invariant.spec.ts: promises of the caregiver conversation over arbitrary event sequences.
// A3: no slot is offered before an explicit consent button. A5: no caregiver text is ever echoed back.
// Only the appt:cancel button can cancel an appointment.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  BUTTON_IDS,
  classifyByRules,
  initialState,
  step,
  type Inbound,
  type Outbound,
} from '@audiorapy/domain';
import { inboundArb, intentArb, iso, stateArb } from '../arbitraries.ts';
import { ctx, slot } from '../helpers.ts';

const MARK = 'QZX';

function bodies(m: Outbound): string {
  if (m.type === 'text') return m.body;
  if (m.type === 'buttons') return [m.body, ...m.buttons.map((b) => b.title + b.id)].join('\n');
  return [m.body, m.buttonLabel, ...m.rows.map((r) => r.title + r.id + (r.description ?? ''))].join(
    '\n',
  );
}

const markedText: fc.Arbitrary<Inbound> = fc
  .string({ maxLength: 80 })
  .map((t) => ({ kind: 'text' as const, text: `${MARK}${t}${MARK}` }));

describe('conversation invariants', () => {
  it('never offers slots before a consent:yes button in the same conversation', () => {
    fc.assert(
      fc.property(
        fc.array(inboundArb, { maxLength: 25 }),
        fc.array(iso, { minLength: 1, maxLength: 5 }),
        (events, offer) => {
          let state = initialState();
          let consented = false;
          for (const inbound of events) {
            const intent =
              inbound.kind === 'text'
                ? classifyByRules(inbound.text)
                : { kind: 'unknown' as const };
            const r = step(state, inbound, ctx(intent, offer.map(slot)));
            if (r.effects.some((e) => e.type === 'record_consent' && e.accepted)) {
              expect(inbound).toEqual({ kind: 'button', id: BUTTON_IDS.consentYes });
              consented = true;
            }
            if (r.effects.some((e) => e.type === 'record_consent' && !e.accepted))
              consented = false;
            if (
              r.outbound.some((m) => m.key === 'slot_list') ||
              r.effects.some((e) => e.type === 'book')
            ) {
              expect(consented).toBe(true);
            }
            state = r.state;
          }
        },
      ),
      { numRuns: 1500 },
    );
  });

  it('never echoes caregiver text in any outbound message', () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(inboundArb, markedText), { maxLength: 20 }),
        fc.array(iso, { maxLength: 5 }),
        (events, offer) => {
          let state = initialState();
          for (const inbound of events) {
            const intent =
              inbound.kind === 'text'
                ? classifyByRules(inbound.text)
                : { kind: 'unknown' as const };
            const r = step(state, inbound, ctx(intent, offer.map(slot)));
            for (const m of r.outbound) expect(bodies(m)).not.toContain(MARK);
            state = r.state;
          }
        },
      ),
      { numRuns: 1500 },
    );
  });

  it('only the explicit cancel button cancels, from any state and any interpreted intent', () => {
    fc.assert(
      fc.property(
        stateArb,
        fc.oneof(inboundArb, markedText),
        intentArb,
        fc.array(iso, { maxLength: 5 }),
        (state, inbound, intent, offer) => {
          const r = step(state, inbound, ctx(intent, offer.map(slot)));
          if (r.effects.some((e) => e.type === 'cancel_appointment')) {
            expect(inbound).toEqual({ kind: 'button', id: BUTTON_IDS.apptCancel });
          }
        },
      ),
      { numRuns: 3000 },
    );
  });

  it('consent is recorded as accepted only from the consent:yes button, from any state and intent', () => {
    fc.assert(
      fc.property(
        stateArb,
        fc.oneof(inboundArb, markedText),
        intentArb,
        fc.array(iso, { maxLength: 5 }),
        (state, inbound, intent, offer) => {
          const r = step(state, inbound, ctx(intent, offer.map(slot)));
          if (r.effects.some((e) => e.type === 'record_consent' && e.accepted)) {
            expect(inbound).toEqual({ kind: 'button', id: BUTTON_IDS.consentYes });
          }
          if (
            state.step === 'new' ||
            state.step === 'awaiting_consent' ||
            state.step === 'declined'
          ) {
            const offersSlots =
              r.outbound.some((m) => m.key === 'slot_list') ||
              r.effects.some((e) => e.type === 'book');
            if (offersSlots) expect(inbound).toEqual({ kind: 'button', id: BUTTON_IDS.consentYes });
          }
        },
      ),
      { numRuns: 3000 },
    );
  });

  it('only an offered slot is ever booked', () => {
    fc.assert(
      fc.property(
        fc.array(inboundArb, { maxLength: 25 }),
        fc.array(iso, { maxLength: 5 }),
        (events, offer) => {
          let state = initialState();
          for (const inbound of events) {
            const before = state;
            const r = step(state, inbound, ctx({ kind: 'unknown' }, offer.map(slot)));
            for (const e of r.effects) {
              if (e.type === 'book') {
                expect(before.step).toBe('choosing_slot');
                if (before.step === 'choosing_slot') expect(before.offered).toContain(e.startsAt);
              }
            }
            state = r.state;
          }
        },
      ),
      { numRuns: 1500 },
    );
  });
});
