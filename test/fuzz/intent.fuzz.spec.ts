// intent.fuzz.spec.ts: arbitrary caregiver text and arbitrary model output never break classification.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { classifyByRules, IntentSchema, parseIntent } from '@audiorapy/domain';

describe('intent (fuzz)', () => {
  it('classifyByRules returns a schema-valid intent for any string', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary', maxLength: 2000 }), (text) => {
        expect(IntentSchema.safeParse(classifyByRules(text)).success).toBe(true);
      }),
      { numRuns: 2000 },
    );
  });

  it('parseIntent never throws and returns only schema-valid intents', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        const r = parseIntent(raw);
        if (r !== null) expect(IntentSchema.safeParse(r).success).toBe(true);
      }),
      { numRuns: 2000 },
    );
  });

  it('parseIntent on JSON-shaped garbage', () => {
    const shaped = fc.record({
      kind: fc.oneof(fc.constantFrom('affirm', 'cancel', 'book', ''), fc.string()),
      preference: fc.option(
        fc.record({ weekday: fc.integer({ min: -3, max: 10 }), partOfDay: fc.string() }),
        { nil: undefined },
      ),
    });
    fc.assert(fc.property(shaped, (raw) => void parseIntent(raw)));
  });
});
