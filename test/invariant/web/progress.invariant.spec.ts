// progress.invariant.spec.ts: for any caseload, every chart point comes from a real session of that
// patient, in date order, within 0..100 — the chart cannot show a number the trials do not support.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { CUE_LEVELS, summarizeTarget } from '@audiorapy/domain';
import { progressSeries } from '../../../apps/web/src/lib/progress.ts';
import type { Patient, Session } from '../../../apps/web/src/lib/records.ts';

const targetIds = ['a', 'b', 'c'];
const trial = fc.record({ correct: fc.boolean(), cue: fc.constantFrom(...CUE_LEVELS) });
const session: fc.Arbitrary<Session> = fc.record({
  kind: fc.constant('session' as const),
  id: fc.uuid(),
  patientId: fc.constantFrom('p1', 'p2'),
  date: fc
    .date({ min: new Date('2026-01-01'), max: new Date('2026-12-31'), noInvalidDate: true })
    .map((d) => d.toISOString().slice(0, 10)),
  targets: fc.array(
    fc.record({
      targetId: fc.constantFrom(...targetIds, 'zz'),
      targetLabel: fc.string(),
      trials: fc.array(trial, { maxLength: 20 }),
    }),
    { maxLength: 4 },
  ),
  therapistNotes: fc.constant(''),
});
const patient: Patient = {
  kind: 'patient',
  id: 'p1',
  alias: 'P',
  synthetic: true,
  targets: targetIds.map((id) => ({ id, label: id, criterionPercent: 80 })),
};

describe('progress invariants', () => {
  it('points come from this patient’s sessions, are ordered and match the trials', () => {
    fc.assert(
      fc.property(fc.array(session, { maxLength: 15 }), (sessions) => {
        const series = progressSeries(patient, sessions);
        expect(series.map((s) => s.targetId)).toEqual(targetIds);
        for (const s of series) {
          const dates = s.points.map((p) => p.date);
          expect([...dates].sort()).toEqual(dates);
          for (const p of s.points) {
            const source = sessions.find((x) => x.id === p.sessionId);
            expect(source?.patientId).toBe('p1');
            const block = source!.targets.find((b) => b.targetId === s.targetId)!;
            expect(p.percent).toBe(summarizeTarget(block).percent);
            expect(p.total).toBeGreaterThan(0);
          }
        }
      }),
      { numRuns: 1000 },
    );
  });
});
