// vault.ts: end-to-end encryption envelope for clinical records.
// A random data key (DEK) encrypts records with XChaCha20-Poly1305; the DEK is wrapped twice:
// by an Argon2id key from the passphrase and by a printed 24-word recovery phrase.
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { argon2id } from '@noble/hashes/argon2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { entropyToMnemonic, mnemonicToEntropy } from '@scure/bip39';
import { wordlist as spanish } from '@scure/bip39/wordlists/spanish.js';
import { z } from 'zod';
import { canonicalJson, fromBase64, fromUtf8, toBase64, utf8 } from './encoding.ts';

export const KEY_BYTES = 32;
const NONCE_BYTES = 24;
const SALT_BYTES = 16;

export interface KdfParams {
  alg: 'argon2id';
  t: number;
  m: number; // KiB
  p: number;
  salt: string; // base64
}

/** OWASP 2024 minimum for Argon2id: 19 MiB, 2 iterations, 1 lane. */
export const DEFAULT_KDF: Omit<KdfParams, 'salt'> = { alg: 'argon2id', t: 2, m: 19 * 1024, p: 1 };

const KdfSchema = z.object({
  alg: z.literal('argon2id'),
  t: z.number().int().min(1).max(10),
  m: z
    .number()
    .int()
    .min(8)
    .max(1024 * 1024),
  p: z.number().int().min(1).max(4),
  salt: z.string().min(1),
});

const WrapSchema = z.object({
  kind: z.enum(['passphrase', 'recovery']),
  nonce: z.string(),
  ct: z.string(),
  kdf: KdfSchema.optional(),
});

export const VaultHeaderSchema = z.object({
  v: z.literal(1),
  wraps: z.array(WrapSchema).min(1),
  fingerprint: z.string(),
});

export type VaultHeader = z.infer<typeof VaultHeaderSchema>;
type Wrap = z.infer<typeof WrapSchema>;

export const EncryptedRecordSchema = z.object({
  v: z.literal(1),
  id: z.string().min(1),
  type: z.string().min(1),
  nonce: z.string(),
  ct: z.string(),
});

export type EncryptedRecord = z.infer<typeof EncryptedRecordSchema>;

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function seal(key: Uint8Array, plaintext: Uint8Array, aad: Uint8Array) {
  const nonce = randomBytes(NONCE_BYTES);
  const ct = xchacha20poly1305(key, nonce, aad).encrypt(plaintext);
  return { nonce: toBase64(nonce), ct: toBase64(ct) };
}

function open(key: Uint8Array, nonce: string, ct: string, aad: Uint8Array): Uint8Array | null {
  try {
    return xchacha20poly1305(key, fromBase64(nonce), aad).decrypt(fromBase64(ct));
  } catch {
    return null;
  }
}

function deriveKek(passphrase: string, kdf: KdfParams): Uint8Array {
  return argon2id(utf8(passphrase.normalize('NFKC')), fromBase64(kdf.salt), {
    t: kdf.t,
    m: kdf.m,
    p: kdf.p,
    dkLen: KEY_BYTES,
  });
}

const WRAP_AAD = utf8('audiorapy/dek/v1');

/** Short public fingerprint of the DEK, to tell vaults apart without revealing the key. */
export function fingerprint(dek: Uint8Array): string {
  return bytesToHex(sha256(dek)).slice(0, 16);
}

export interface CreatedVault {
  header: VaultHeader;
  dek: Uint8Array;
  recoveryPhrase: string;
}

export const MIN_PASSPHRASE_LENGTH = 10;

export function createVault(
  passphrase: string,
  kdf: Omit<KdfParams, 'salt'> = DEFAULT_KDF,
): CreatedVault {
  if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
    throw new Error(`passphrase must have at least ${MIN_PASSPHRASE_LENGTH} characters`);
  }
  const dek = randomBytes(KEY_BYTES);
  const params: KdfParams = { ...kdf, salt: toBase64(randomBytes(SALT_BYTES)) };
  const recoveryEntropy = randomBytes(KEY_BYTES);
  const header: VaultHeader = {
    v: 1,
    fingerprint: fingerprint(dek),
    wraps: [
      { kind: 'passphrase', kdf: params, ...seal(deriveKek(passphrase, params), dek, WRAP_AAD) },
      { kind: 'recovery', ...seal(recoveryEntropy, dek, WRAP_AAD) },
    ],
  };
  return { header, dek, recoveryPhrase: entropyToMnemonic(recoveryEntropy, spanish) };
}

function unwrap(wrap: Wrap, kek: Uint8Array, header: VaultHeader): Uint8Array | null {
  const dek = open(kek, wrap.nonce, wrap.ct, WRAP_AAD);
  if (!dek || dek.length !== KEY_BYTES || fingerprint(dek) !== header.fingerprint) return null;
  return dek;
}

/** The DEK, or null when the passphrase is wrong or the header is malformed. Never throws. */
export function unlockWithPassphrase(header: unknown, passphrase: string): Uint8Array | null {
  const parsed = VaultHeaderSchema.safeParse(header);
  if (!parsed.success) return null;
  for (const wrap of parsed.data.wraps) {
    if (wrap.kind !== 'passphrase' || !wrap.kdf) continue;
    try {
      const dek = unwrap(wrap, deriveKek(passphrase, wrap.kdf), parsed.data);
      if (dek) return dek;
    } catch {
      continue;
    }
  }
  return null;
}

/** Accepts the printed phrase with or without accents, any case or spacing. */
export function normalizeRecoveryPhrase(input: string): string | null {
  const words = input
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const mapped = words.map((w) => STRIPPED_TO_WORD.get(w));
  if (mapped.length !== 24 || mapped.some((w) => w === undefined)) return null;
  return mapped.join(' ');
}

const STRIPPED_TO_WORD = new Map(
  spanish.map((w) => [w.normalize('NFD').replace(/\p{M}+/gu, ''), w] as const),
);

export function unlockWithRecovery(header: unknown, phrase: string): Uint8Array | null {
  const parsed = VaultHeaderSchema.safeParse(header);
  const normalized = normalizeRecoveryPhrase(phrase);
  if (!parsed.success || !normalized) return null;
  let entropy: Uint8Array;
  try {
    entropy = mnemonicToEntropy(normalized, spanish);
  } catch {
    return null;
  }
  for (const wrap of parsed.data.wraps) {
    if (wrap.kind !== 'recovery') continue;
    const dek = unwrap(wrap, entropy, parsed.data);
    if (dek) return dek;
  }
  return null;
}

/** Re-wraps the DEK under a new passphrase, keeping the recovery wrap. */
export function changePassphrase(
  header: VaultHeader,
  dek: Uint8Array,
  newPassphrase: string,
  kdf: Omit<KdfParams, 'salt'> = DEFAULT_KDF,
): VaultHeader {
  if (newPassphrase.length < MIN_PASSPHRASE_LENGTH) {
    throw new Error(`passphrase must have at least ${MIN_PASSPHRASE_LENGTH} characters`);
  }
  const params: KdfParams = { ...kdf, salt: toBase64(randomBytes(SALT_BYTES)) };
  return {
    ...header,
    wraps: [
      { kind: 'passphrase', kdf: params, ...seal(deriveKek(newPassphrase, params), dek, WRAP_AAD) },
      ...header.wraps.filter((w) => w.kind !== 'passphrase'),
    ],
  };
}

function recordAad(id: string, type: string): Uint8Array {
  return utf8(`audiorapy/record/v1|${id}|${type}`);
}

/** Encrypts a JSON-serializable record. The id and type are bound as associated data. */
export function encryptRecord(
  dek: Uint8Array,
  id: string,
  type: string,
  value: unknown,
): EncryptedRecord {
  const sealed = seal(dek, utf8(canonicalJson(value)), recordAad(id, type));
  return { v: 1, id, type, ...sealed };
}

export type DecryptResult<T> =
  { ok: true; value: T } | { ok: false; error: 'malformed' | 'auth_failed' };

export function decryptRecord<T = unknown>(dek: Uint8Array, record: unknown): DecryptResult<T> {
  const parsed = EncryptedRecordSchema.safeParse(record);
  if (!parsed.success) return { ok: false, error: 'malformed' };
  const { id, type, nonce, ct } = parsed.data;
  let plaintext: Uint8Array | null;
  try {
    plaintext = open(dek, nonce, ct, recordAad(id, type));
  } catch {
    return { ok: false, error: 'malformed' };
  }
  if (!plaintext) return { ok: false, error: 'auth_failed' };
  try {
    return { ok: true, value: JSON.parse(fromUtf8(plaintext)) as T };
  } catch {
    return { ok: false, error: 'malformed' };
  }
}
