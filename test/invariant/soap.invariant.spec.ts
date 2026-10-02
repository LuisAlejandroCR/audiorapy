// soap.invariant.spec.ts: A8 — whatever the model returns, "O" is the computed text and no model-written
// section carries a figure. Summaries are arithmetically consistent for any trial set.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  CUE_LEVELS,
  mergeDraft,
  objectiveText,
  summarizeTarget,
  type TargetSession,
} from '@audiorapy/domain';

const session: fc.Arbitrary<TargetSession> = fc.record({
  targetId: fc.uuid(),
  targetLabel: fc.string({ minLength: 1, maxLength: 30 }),
  trials: fc.array(fc.record({ correct: fc.boolean(), cue: fc.constantFrom(...CUE_LEVELS) }), {
    maxLength: 60,
  }),
});

const draftLike = fc.oneof(
  fc.anything(),
  fc.record({ subjective: fc.string(), assessment: fc.string(), plan: fc.string() }),
  fc.record({
    subjective: fc.string().map((s) => `${s} 100 %`),
    assessment: fc.integer().map((n) => `Logró ${n} aciertos. Bien.`),
    plan: fc.string(),
    objective: fc.constant('O inventada: 99/100'),
  }),
);

describe('soap invariants', () => {
  it('O is always computed by code and S/A/P never contain digits', () => {
    fc.assert(
      fc.property(fc.array(session, { maxLength: 4 }), draftLike, (sessions, raw) => {
        const summaries = sessions.map(summarizeTarget);
        const note = mergeDraft(summaries, raw, 'gemma4:e4b');
        expect(note.objective).toBe(objectiveText(summaries));
        for (const section of [note.subjective, note.assessment, note.plan])
          expect(section).not.toMatch(/\p{Nd}/u);
        expect(note.status).toBe('draft');
      }),
      { numRuns: 1500 },
    );
  });

  it('summaries are consistent: correct ≤ total, percent in 0..100, per-cue counts add up', () => {
    fc.assert(
      fc.property(session, (s) => {
        const sum = summarizeTarget(s);
        expect(sum.total).toBe(s.trials.length);
        expect(sum.correct).toBeLessThanOrEqual(sum.total);
        expect(sum.percent).toBeGreaterThanOrEqual(0);
        expect(sum.percent).toBeLessThanOrEqual(100);
        expect(CUE_LEVELS.reduce((n, c) => n + sum.byCue[c].total, 0)).toBe(sum.total);
        expect(CUE_LEVELS.reduce((n, c) => n + sum.byCue[c].correct, 0)).toBe(sum.correct);
        if (sum.dominantCue)
          for (const c of CUE_LEVELS)
            expect(sum.byCue[c].total).toBeLessThanOrEqual(sum.byCue[sum.dominantCue].total);
      }),
      { numRuns: 1500 },
    );
  });
});
