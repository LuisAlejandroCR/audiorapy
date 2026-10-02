// risk.fuzz.spec.ts: whatever the sidecar answers, the adapter returns a typed result and never throws.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { SidecarRiskAdapter } from '../../../apps/api/src/ai/risk.ts';
import { fakeFetch } from '../../api-helpers.ts';

describe('risk sidecar (fuzz)', () => {
  it('never throws on arbitrary responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.jsonValue(), fc.string()),
        fc.integer({ min: 200, max: 599 }),
        async (body, status) => {
          const a = new SidecarRiskAdapter({
            baseUrl: 'http://risk.test',
            timeoutMs: 1000,
            fetchImpl: fakeFetch(
              () =>
                new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }),
            ),
          });
          const r = await a.score({
            priorVisits: 1,
            priorNoShows: 0,
            leadTimeDays: 1,
            repliedToLastReminder: null,
          });
          if (r.available) {
            expect(r.data.score).toBeGreaterThanOrEqual(0);
            expect(r.data.score).toBeLessThanOrEqual(1);
          } else expect(typeof r.error).toBe('string');
        },
      ),
      { numRuns: 500 },
    );
  });
});
