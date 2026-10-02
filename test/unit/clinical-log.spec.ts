// clinical-log.spec.ts: the append-only hash chain detects edits, reordering and bad amendments.
import { describe, expect, it } from 'vitest';
import { append, encryptRecord, verifyChain, GENESIS_HASH } from '@audiorapy/domain';

const dek = new Uint8Array(32).fill(7);
const rec = (id: string) => encryptRecord(dek, id, 'session_note', { id });

describe('clinical log', () => {
  const log = append(append(append([], rec('a')), rec('b')), rec('c'), 0);

  it('chains entries from the genesis hash', () => {
    expect(log[0]?.prevHash).toBe(GENESIS_HASH);
    expect(log[1]?.prevHash).toBe(log[0]?.hash);
    expect(log[2]?.amends).toBe(0);
    expect(verifyChain(log)).toBe(-1);
  });

  it('detects an edited record', () => {
    const tampered = log.map((e, i) => (i === 1 ? { ...e, record: rec('b2') } : e));
    expect(verifyChain(tampered)).toBe(1);
  });

  it('detects a removed entry', () => {
    expect(verifyChain([log[0]!, log[2]!])).toBe(1);
  });

  it('rejects amending a future entry', () => {
    expect(() => append(log, rec('d'), 5)).toThrow();
  });
});
