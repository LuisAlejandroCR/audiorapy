// risk.invariant.spec.ts: for any domain features — including garbage numbers — the request body stays
// inside the bounds the Python sidecar validates (services/risk/risk/features.py), so a valid booking can
// never be rejected with 422 by the sidecar. The bounds are pinned here and in that file.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { sidecarBody } from '../../../apps/api/src/ai/risk.ts';

const BOUNDS: Record<string, [number, number]> = {
  lead_days: [0, 120],
  weekday: [0, 6],
  hour: [0, 23],
  zone: [0, 9],
  session_number: [1, 500],
  prior_visits: [0, 500],
  prior_no_shows: [0, 500],
  replied_last_reminder: [-1, 1],
};
const INTEGER = new Set(Object.keys(BOUNDS).filter((k) => k !== 'lead_days'));
const num = fc.oneof(fc.double(), fc.integer(), fc.constantFrom(NaN, Infinity, -Infinity, -0));

describe('risk invariants', () => {
  it('every body is within the sidecar schema', () => {
    fc.assert(
      fc.property(
        fc.record(
          {
            priorVisits: num,
            priorNoShows: num,
            leadTimeDays: num,
            repliedToLastReminder: fc.constantFrom(true, false, null),
            weekday: num,
            hour: num,
            sessionNumber: num,
          },
          {
            requiredKeys: ['priorVisits', 'priorNoShows', 'leadTimeDays', 'repliedToLastReminder'],
          },
        ),
        (f) => {
          const body = sidecarBody(f);
          expect(Object.keys(body).sort()).toEqual(Object.keys(BOUNDS).sort());
          for (const [k, [lo, hi]] of Object.entries(BOUNDS)) {
            const v = body[k as keyof typeof body];
            expect(Number.isFinite(v), k).toBe(true);
            expect(v, k).toBeGreaterThanOrEqual(lo);
            expect(v, k).toBeLessThanOrEqual(hi);
            if (INTEGER.has(k)) expect(Number.isInteger(v), k).toBe(true);
          }
          expect(body.prior_no_shows).toBeLessThanOrEqual(body.prior_visits);
        },
      ),
      { numRuns: 3000 },
    );
  });

  it('the pinned bounds match the Python schema file', async () => {
    const { readFileSync } = await import('node:fs');
    const py = readFileSync(
      new URL('../../../services/risk/risk/features.py', import.meta.url),
      'utf8',
    );
    for (const [k, [lo, hi]] of Object.entries(BOUNDS)) {
      expect(py, k).toMatch(new RegExp(`${k}: (int|float) = Field\\(ge=${lo}, le=${hi}\\)`));
    }
  });
});
