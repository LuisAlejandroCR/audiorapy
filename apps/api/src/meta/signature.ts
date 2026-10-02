// signature.ts: Meta webhook signature check — HMAC-SHA256 over the exact raw bytes, fail closed.
import { createHmac, timingSafeEqual } from 'node:crypto';

export type SignatureCheck =
  'ok' | 'missing_secret' | 'missing_body' | 'missing_header' | 'mismatch';

export function verifySignature(
  rawBody: Buffer | undefined,
  header: string | undefined,
  appSecret: string | undefined,
): SignatureCheck {
  if (!appSecret) return 'missing_secret';
  if (!rawBody) return 'missing_body';
  if (!header || !header.startsWith('sha256=')) return 'missing_header';
  const given = Buffer.from(header.slice('sha256='.length), 'hex');
  const expected = createHmac('sha256', appSecret).update(rawBody).digest();
  if (given.length !== expected.length) return 'mismatch';
  return timingSafeEqual(given, expected) ? 'ok' : 'mismatch';
}

export function sign(rawBody: Buffer | string, appSecret: string): string {
  return `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
}
