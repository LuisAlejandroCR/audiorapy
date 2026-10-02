// vault.spec.ts: create, unlock (passphrase and recovery phrase), re-key, and record encryption.
import { describe, expect, it } from 'vitest';
import {
  changePassphrase,
  createVault,
  decryptRecord,
  encryptRecord,
  normalizeRecoveryPhrase,
  unlockWithPassphrase,
  unlockWithRecovery,
} from '@audiorapy/domain';
import { FAST_KDF } from '../helpers.ts';

const PASS = 'frase de prueba larga';

describe('vault', () => {
  const vault = createVault(PASS, FAST_KDF);

  it('rejects short passphrases', () => {
    expect(() => createVault('corta', FAST_KDF)).toThrow(/at least/);
  });

  it('issues a 24-word Spanish recovery phrase', () => {
    expect(vault.recoveryPhrase.split(' ')).toHaveLength(24);
  });

  it('unlocks with the passphrase and with the recovery phrase to the same key', () => {
    expect(unlockWithPassphrase(vault.header, PASS)).toEqual(vault.dek);
    expect(unlockWithRecovery(vault.header, vault.recoveryPhrase)).toEqual(vault.dek);
  });

  it('accepts the recovery phrase typed without accents, in capitals, with extra spaces', () => {
    const typed =
      '  ' +
      vault.recoveryPhrase
        .normalize('NFD')
        .replace(/\p{M}+/gu, '')
        .toUpperCase()
        .split(' ')
        .join('   ') +
      ' ';
    expect(unlockWithRecovery(vault.header, typed)).toEqual(vault.dek);
  });

  it('fails closed on a wrong passphrase, a wrong phrase or a malformed header', () => {
    expect(unlockWithPassphrase(vault.header, 'otra frase cualquiera')).toBeNull();
    expect(unlockWithRecovery(vault.header, 'hola '.repeat(24))).toBeNull();
    expect(unlockWithPassphrase({ v: 2 }, PASS)).toBeNull();
    expect(normalizeRecoveryPhrase('uno dos')).toBeNull();
  });

  it('changes the passphrase and keeps the recovery wrap working', () => {
    const header = changePassphrase(vault.header, vault.dek, 'nueva frase segura', FAST_KDF);
    expect(unlockWithPassphrase(header, PASS)).toBeNull();
    expect(unlockWithPassphrase(header, 'nueva frase segura')).toEqual(vault.dek);
    expect(unlockWithRecovery(header, vault.recoveryPhrase)).toEqual(vault.dek);
  });

  it('round-trips a record and binds id and type', () => {
    const enc = encryptRecord(vault.dek, 'note-1', 'session_note', { s: 'Llegó contento', n: 3 });
    expect(decryptRecord(vault.dek, enc)).toEqual({
      ok: true,
      value: { n: 3, s: 'Llegó contento' },
    });
    expect(decryptRecord(vault.dek, { ...enc, id: 'note-2' })).toEqual({
      ok: false,
      error: 'auth_failed',
    });
    expect(decryptRecord(vault.dek, { ...enc, type: 'patient' })).toEqual({
      ok: false,
      error: 'auth_failed',
    });
    expect(decryptRecord(vault.dek, { nope: true })).toEqual({ ok: false, error: 'malformed' });
  });

  it('never stores plaintext in the envelope', () => {
    const enc = encryptRecord(vault.dek, 'p-1', 'patient', { name: 'NIÑO SINTÉTICO' });
    expect(JSON.stringify(enc)).not.toContain('SINT');
  });
});
