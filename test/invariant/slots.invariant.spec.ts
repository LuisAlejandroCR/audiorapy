// slots.invariant.spec.ts: every offered slot is inside a window, after the lead time, clear of every
// busy visit plus travel buffer, unique, sorted and within the limit.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { findSlots, parseClock, toLocalParts, type SlotQuery } from '@audiorapy/domain';

const clock = fc
  .integer({ min: 0, max: 23 * 60 + 59 })
  .map((m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);

const queryArb: fc.Arbitrary<SlotQuery> = fc.record({
  now: fc.date({ min: new Date('2026-01-01'), max: new Date('2027-01-01'), noInvalidDate: true }),
  windows: fc.array(
    fc.record({ weekday: fc.integer({ min: 0, max: 6 }), start: clock, end: clock }),
    { maxLength: 8 },
  ),
  busy: fc.constant([]),
  durationMinutes: fc.integer({ min: 15, max: 120 }),
  bufferMinutes: fc.integer({ min: 0, max: 90 }),
  minLeadMinutes: fc.integer({ min: 0, max: 3 * 24 * 60 }),
  horizonDays: fc.integer({ min: 0, max: 21 }),
  stepMinutes: fc.integer({ min: 5, max: 90 }),
  limit: fc.integer({ min: 0, max: 10 }),
});

const withBusy = queryArb.chain((q) =>
  fc
    .array(fc.tuple(fc.integer({ min: 0, max: 20 * 24 * 60 }), fc.integer({ min: 15, max: 240 })), {
      maxLength: 8,
    })
    .map((pairs) => ({
      ...q,
      busy: pairs.map(([offset, len]) => {
        const start = q.now.getTime() + offset * 60_000;
        return {
          startsAt: new Date(start).toISOString(),
          endsAt: new Date(start + len * 60_000).toISOString(),
        };
      }),
    })),
);

describe('findSlots invariants', () => {
  it('every slot honors windows, lead time, busy+buffer, uniqueness, order and limit', () => {
    fc.assert(
      fc.property(withBusy, (q) => {
        const { slots } = findSlots(q);
        expect(slots.length).toBeLessThanOrEqual(q.limit);
        const starts = slots.map((s) => Date.parse(s.startsAt));
        expect(new Set(starts).size).toBe(starts.length);
        expect([...starts].sort((a, b) => a - b)).toEqual(starts);

        for (const s of slots) {
          const start = Date.parse(s.startsAt);
          const end = Date.parse(s.endsAt);
          expect(end - start).toBe(q.durationMinutes * 60_000);
          expect(start).toBeGreaterThanOrEqual(q.now.getTime() + q.minLeadMinutes * 60_000);

          const local = toLocalParts(new Date(start));
          const inWindow = q.windows.some((w) => {
            const open = parseClock(w.start)!;
            const close = parseClock(w.end)!;
            return (
              w.weekday === local.weekday &&
              local.minutes >= open &&
              local.minutes + q.durationMinutes <= close
            );
          });
          expect(inWindow).toBe(true);

          const buffer = q.bufferMinutes * 60_000;
          for (const b of q.busy) {
            const clear =
              end + buffer <= Date.parse(b.startsAt) || start >= Date.parse(b.endsAt) + buffer;
            expect(clear).toBe(true);
          }
        }
      }),
      { numRuns: 1000 },
    );
  });
});
