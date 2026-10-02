// clinical-log.ts: append-only, hash-chained log of encrypted clinical records.
// A correction is a new entry that references the one it amends; nothing is overwritten.
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { canonicalJson, utf8 } from './encoding.ts';
import type { EncryptedRecord } from './vault.ts';

export const GENESIS_HASH = '0'.repeat(64);

export interface LogEntry {
  seq: number;
  prevHash: string;
  record: EncryptedRecord;
  amends?: number;
  hash: string;
}

function entryHash(
  seq: number,
  prevHash: string,
  record: EncryptedRecord,
  amends?: number,
): string {
  return bytesToHex(sha256(utf8(canonicalJson({ seq, prevHash, record, amends: amends ?? null }))));
}

export function append(
  log: readonly LogEntry[],
  record: EncryptedRecord,
  amends?: number,
): LogEntry[] {
  const last = log[log.length - 1];
  const seq = last ? last.seq + 1 : 0;
  const prevHash = last ? last.hash : GENESIS_HASH;
  if (amends !== undefined && (amends < 0 || amends >= seq)) {
    throw new Error('an amendment must reference an earlier entry');
  }
  const entry: LogEntry = { seq, prevHash, record, hash: entryHash(seq, prevHash, record, amends) };
  if (amends !== undefined) entry.amends = amends;
  return [...log, entry];
}

/** Index of the first entry that breaks the chain, or -1 when the whole log is intact. */
export function verifyChain(log: readonly LogEntry[]): number {
  let prevHash = GENESIS_HASH;
  for (let i = 0; i < log.length; i++) {
    const e = log[i]!;
    const amendsOk = e.amends === undefined || (e.amends >= 0 && e.amends < i);
    if (
      e.seq !== i ||
      e.prevHash !== prevHash ||
      !amendsOk ||
      e.hash !== entryHash(e.seq, e.prevHash, e.record, e.amends)
    ) {
      return i;
    }
    prevHash = e.hash;
  }
  return -1;
}
