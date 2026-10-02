// eval.invariant.spec.ts: for any predictions, the report is internally consistent — counts add up,
// accuracy is correct/total, and every miss appears exactly once among the confusions.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { INTENT_KINDS } from '@audiorapy/domain';
import { score, type Prediction } from '../../../apps/api/src/ai/eval.ts';

const kind = fc.constantFrom(...INTENT_KINDS);
const prediction: fc.Arbitrary<Prediction> = fc.record({
  item: fc.record({ text: fc.string({ minLength: 1, maxLength: 20 }), kind }),
  intent: fc.option(fc.record({ kind }), { nil: null }),
  ms: fc.nat({ max: 10_000 }),
  error: fc.constant(null),
});

describe('eval invariants', () => {
  it('counts add up for any prediction set', () => {
    fc.assert(
      fc.property(fc.array(prediction, { maxLength: 60 }), (preds) => {
        const r = score('x', preds);
        expect(r.total).toBe(preds.length);
        expect(r.correct + r.confusions.length).toBe(r.total);
        expect(r.confusions.filter((c) => c.got === 'degraded').length).toBe(r.degraded);
        expect(INTENT_KINDS.reduce((n, k) => n + r.perKind[k].total, 0)).toBe(r.total);
        expect(INTENT_KINDS.reduce((n, k) => n + r.perKind[k].correct, 0)).toBe(r.correct);
        expect(r.accuracy).toBe(r.total === 0 ? 0 : r.correct / r.total);
        expect(r.latencyMs.p50).toBeLessThanOrEqual(r.latencyMs.p95);
        expect(r.latencyMs.p95).toBeLessThanOrEqual(r.latencyMs.max);
      }),
      { numRuns: 1000 },
    );
  });
});
