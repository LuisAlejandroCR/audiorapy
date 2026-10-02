// vault.invariant.spec.ts: A7 — any record round-trips under the right key, never decrypts under another,
// and its plaintext never appears in the envelope.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  canonicalJson,
  createVault,
  decryptRecord,
  encryptRecord,
  unlockWithPassphrase,
  unlockWithRecovery,
} from '@audiorapy/domain';
import { FAST_KDF } from '../helpers.ts';

const a = createVault('primera frase larga', FAST_KDF);
const b = createVault('segunda frase larga', FAST_KDF);

const json = fc.jsonValue().filter((v) => v !== null && v !== undefined);

describe('vault invariants', () => {
  it('round-trips any JSON record under its own key and fails under another', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        json,
        (id, type, value) => {
          const enc = encryptRecord(a.dek, id, type, value);
          const back = decryptRecord(a.dek, enc);
          expect(back.ok).toBe(true);
          if (back.ok) expect(canonicalJson(back.value)).toBe(canonicalJson(value));
          expect(decryptRecord(b.dek, enc)).toEqual({ ok: false, error: 'auth_failed' });
        },
      ),
      { numRuns: 500 },
    );
  });

  it('a marked secret never appears in the envelope', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 6, maxLength: 40 }), (secret) => {
        const marked = `PII:${secret}`;
        const enc = encryptRecord(a.dek, 'id', 'patient', { name: marked });
        expect(enc.ct).not.toContain('PII:');
        expect(enc.nonce).not.toContain('PII:');
      }),
      { numRuns: 500 },
    );
  });

  it('two vaults never share a key, and no wrong secret unlocks either', () => {
    expect(a.dek).not.toEqual(b.dek);
    fc.assert(
      fc.property(fc.string({ maxLength: 40 }), (guess) => {
        fc.pre(guess !== 'primera frase larga');
        expect(unlockWithPassphrase(a.header, guess)).toBeNull();
        expect(unlockWithRecovery(a.header, guess)).toBeNull();
      }),
      { numRuns: 200 },
    );
    expect(unlockWithRecovery(a.header, b.recoveryPhrase)).toBeNull();
  });
});
