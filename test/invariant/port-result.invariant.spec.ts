// port-result.invariant.spec.ts: a degraded result never carries data, an available one never carries an error.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { degraded, ok } from '@audiorapy/domain';

describe('PortResult invariant', () => {
  it('available and data/error are mutually exclusive', () => {
    fc.assert(
      fc.property(fc.string(), fc.anything(), fc.boolean(), (source, payload, good) => {
        const r = good ? ok(source, payload) : degraded(source, payload);
        if (r.available) expect('error' in r).toBe(false);
        else {
          expect(r.data).toBeNull();
          expect(r.error.length).toBeGreaterThan(0);
        }
        expect(Number.isNaN(Date.parse(r.checked_at))).toBe(false);
      }),
    );
  });
});
