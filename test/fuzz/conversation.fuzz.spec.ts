// conversation.fuzz.spec.ts: any inbound (text or forged button id) from any state yields a valid step.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  BUTTON_TITLE_MAX,
  classifyByRules,
  LIST_ROW_TITLE_MAX,
  MAX_BUTTONS,
  MAX_LIST_ROWS,
  step,
} from '@audiorapy/domain';
import { inboundArb, iso, stateArb } from '../arbitraries.ts';
import { ctx, slot } from '../helpers.ts';

describe('conversation (fuzz)', () => {
  it('always returns a state and WhatsApp-valid outbound messages', () => {
    fc.assert(
      fc.property(
        stateArb,
        inboundArb,
        fc.array(iso, { maxLength: 15 }),
        (state, inbound, offer) => {
          const intent =
            inbound.kind === 'text' ? classifyByRules(inbound.text) : { kind: 'unknown' as const };
          const r = step(state, inbound, ctx(intent, offer.map(slot)));
          expect(r.state).toBeDefined();
          expect(r.outbound.length).toBeGreaterThan(0);
          for (const m of r.outbound) {
            if (m.type === 'buttons') {
              expect(m.buttons.length).toBeLessThanOrEqual(MAX_BUTTONS);
              for (const b of m.buttons)
                expect(b.title.length).toBeLessThanOrEqual(BUTTON_TITLE_MAX);
            }
            if (m.type === 'list') {
              expect(m.rows.length).toBeLessThanOrEqual(MAX_LIST_ROWS);
              for (const row of m.rows)
                expect(row.title.length).toBeLessThanOrEqual(LIST_ROW_TITLE_MAX);
            }
          }
        },
      ),
      { numRuns: 2000 },
    );
  });
});
