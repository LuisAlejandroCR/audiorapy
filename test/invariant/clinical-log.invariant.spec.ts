// clinical-log.invariant.spec.ts: any single change to any entry of a valid log is detected at or before it.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { append, encryptRecord, verifyChain, type LogEntry } from '@audiorapy/domain';

const dek = new Uint8Array(32).fill(3);

describe('clinical log invariants', () => {
  it('a valid log verifies; tampering with any field of any entry is detected', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ maxLength: 20 }), { minLength: 1, maxLength: 12 }),
        fc.nat(),
        fc.constantFrom('record', 'prevHash', 'hash', 'seq', 'drop', 'swap'),
        (payloads, pick, field) => {
          let log: LogEntry[] = [];
          payloads.forEach(
            (p, i) => (log = append(log, encryptRecord(dek, `r${i}`, 'note', { p }))),
          );
          expect(verifyChain(log)).toBe(-1);

          const i = pick % log.length;
          const copy = log.map((e) => ({ ...e }));
          const target = copy[i]!;
          if (field === 'record')
            target.record = encryptRecord(dek, `r${i}`, 'note', { p: 'altered' });
          if (field === 'prevHash') target.prevHash = 'f'.repeat(64);
          if (field === 'hash') target.hash = 'e'.repeat(64);
          if (field === 'seq') target.seq += 1;
          if (field === 'drop') copy.splice(i, 1);
          if (field === 'swap') {
            fc.pre(copy.length > 1);
            const j = (i + 1) % copy.length;
            [copy[i], copy[j]] = [copy[j]!, copy[i]!];
          }
          if (field === 'drop' && i === copy.length) {
            // Dropping the tail leaves a shorter but valid log; truncation is caught by the stored head hash, not the chain.
            expect(verifyChain(copy)).toBe(-1);
            return;
          }
          const broken = verifyChain(copy);
          expect(broken).toBeGreaterThanOrEqual(0);
          expect(broken).toBeLessThanOrEqual(
            field === 'swap' ? Math.max(i, (i + 1) % log.length) : i,
          );
        },
      ),
      { numRuns: 1000 },
    );
  });
});
