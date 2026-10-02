// consent.ts: versioned consent records (Ley 1581). Evidence is stored in clear; the latest
// non-revoked record for a purpose decides.
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { utf8 } from './encoding.ts';

export const CONSENT_PURPOSES = [
  'whatsapp_scheduling',
  'sensitive_health_data',
  'ai_processing',
  'recording',
] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export interface ConsentRecord {
  contactRef: string;
  purpose: ConsentPurpose;
  granted: boolean;
  textVersion: string;
  textHash: string;
  signedAt: string;
  signerRole: 'legal_representative';
  channel: 'whatsapp_button' | 'web_form';
  childAssent: boolean | null;
  revokedAt: string | null;
}

export function hashConsentText(text: string): string {
  return bytesToHex(sha256(utf8(text)));
}

export function recordConsent(
  input: Omit<ConsentRecord, 'textHash' | 'revokedAt' | 'signerRole'> & {
    text: string;
  },
): ConsentRecord {
  const { text, ...rest } = input;
  return {
    ...rest,
    textHash: hashConsentText(text),
    signerRole: 'legal_representative',
    revokedAt: null,
  };
}

/** True only when the latest decision for this purpose, at `at`, is a non-revoked grant. */
export function allows(
  records: readonly ConsentRecord[],
  contactRef: string,
  purpose: ConsentPurpose,
  at: Date,
): boolean {
  const latest = records
    .filter(
      (r) =>
        r.contactRef === contactRef &&
        r.purpose === purpose &&
        Date.parse(r.signedAt) <= at.getTime(),
    )
    .sort((a, b) => a.signedAt.localeCompare(b.signedAt))
    .at(-1);
  if (!latest || !latest.granted) return false;
  return latest.revokedAt === null || Date.parse(latest.revokedAt) > at.getTime();
}
