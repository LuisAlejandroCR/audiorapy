// vault.fuzz.spec.ts: malformed headers, records and recovery phrases fail closed without throwing.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  createVault,
  decryptRecord,
  encryptRecord,
  normalizeRecoveryPhrase,
  unlockWithPassphrase,
  unlockWithRecovery,
} from '@audiorapy/domain';
import { FAST_KDF } from '../helpers.ts';

const vault = createVault('frase de prueba larga', FAST_KDF);

describe('vault (fuzz)', () => {
  it('decryptRecord never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => {
        expect(decryptRecord(vault.dek, raw).ok).toBe(false);
      }),
      { numRuns: 1000 },
    );
  });

  it('decryptRecord fails closed on any mutated ciphertext', () => {
    const enc = encryptRecord(vault.dek, 'r1', 'note', { x: 'y' });
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ maxLength: 60 }),
        (ct, nonce) => {
          expect(decryptRecord(vault.dek, { ...enc, ct }).ok).toBe(false);
          expect(decryptRecord(vault.dek, { ...enc, nonce }).ok).toBe(false);
        },
      ),
    );
  });

  it('unlock never throws on arbitrary headers', () => {
    fc.assert(
      fc.property(fc.anything(), fc.string(), (header, secret) => {
        expect(unlockWithPassphrase(header, secret)).toBeNull();
        expect(unlockWithRecovery(header, secret)).toBeNull();
      }),
      { numRuns: 500 },
    );
  });

  it('normalizeRecoveryPhrase never throws', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }), (s) => void normalizeRecoveryPhrase(s)),
      { numRuns: 1000 },
    );
  });
});
