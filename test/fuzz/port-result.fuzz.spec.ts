// port-result.fuzz.spec.ts: guard never throws, whatever the adapter throws or returns.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { guard } from '@audiorapy/domain';

describe('guard (fuzz)', () => {
  it('never rejects, for any thrown value', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), fc.boolean(), async (value, shouldThrow) => {
        const r = await guard(
          'fuzz',
          async () => {
            if (shouldThrow) throw value;
            return value;
          },
          1000,
        );
        expect(typeof r.available).toBe('boolean');
        if (!r.available) expect(typeof r.error).toBe('string');
      }),
    );
  });
});
