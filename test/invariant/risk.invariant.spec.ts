// risk.invariant.spec.ts: risk score is bounded and never decreases with more no-shows.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { heuristicRisk } from '@audiorapy/domain';

describe('risk invariants', () => {
  it('score in [0,1] and monotone in prior no-shows', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200 }),
        fc.integer({ min: 0, max: 200 }),
        fc.integer({ min: 0, max: 120 }),
        fc.constantFrom(true, false, null),
        (visits, noShows, lead, replied) => {
          const base = { priorVisits: visits, leadTimeDays: lead, repliedToLastReminder: replied };
          const r1 = heuristicRisk({ ...base, priorNoShows: noShows });
          const r2 = heuristicRisk({ ...base, priorNoShows: noShows + 1 });
          expect(r1.score).toBeGreaterThanOrEqual(0);
          expect(r1.score).toBeLessThanOrEqual(1);
          expect(r2.score).toBeGreaterThanOrEqual(r1.score);
        },
      ),
      { numRuns: 2000 },
    );
  });
});
