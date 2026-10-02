// slots.fuzz.spec.ts: arbitrary (including nonsense) scheduling config never throws.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { findSlots } from '@audiorapy/domain';

describe('findSlots (fuzz)', () => {
  it('never throws and never exceeds the limit', () => {
    fc.assert(
      fc.property(
        fc.record({
          now: fc.date({
            noInvalidDate: true,
            min: new Date('2000-01-01'),
            max: new Date('2100-01-01'),
          }),
          windows: fc.array(
            fc.record({
              weekday: fc.integer({ min: -2, max: 9 }),
              start: fc.string({ maxLength: 6 }),
              end: fc.string({ maxLength: 6 }),
            }),
            { maxLength: 6 },
          ),
          busy: fc.array(fc.record({ startsAt: fc.string(), endsAt: fc.string() }), {
            maxLength: 5,
          }),
          durationMinutes: fc.double(),
          bufferMinutes: fc.double(),
          minLeadMinutes: fc.integer(),
          horizonDays: fc.double(),
          stepMinutes: fc.double(),
          limit: fc.double(),
        }),
        (q) => {
          const { slots } = findSlots(q);
          expect(slots.length).toBeLessThanOrEqual(10);
        },
      ),
      { numRuns: 500 },
    );
  });
});
