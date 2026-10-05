// qr.ts: a QR code as one SVG path (no inline styles, so it renders under the strict CSP). Only http(s)
// and exp(s) links are encoded; anything else, or text too long for a QR code, gives null.
import qrcode from 'qrcode-generator';

export interface QrPath {
  /** Modules per side, without the quiet zone. */
  size: number;
  /** "M x y h1 v1 h-1 z" squares, one per dark module, offset by the quiet zone. */
  d: string;
  dark: number;
}

export const QUIET = 4;
const MAX_LENGTH = 512;
const ALLOWED = /^(https?|exps?):\/\/[^\s]+$/i;

export function qrPath(url: string): QrPath | null {
  if (url.length > MAX_LENGTH || !ALLOWED.test(url)) return null;
  try {
    const code = qrcode(0, 'M');
    code.addData(url, 'Byte');
    code.make();
    const size = code.getModuleCount();
    const parts: string[] = [];
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (code.isDark(r, c)) parts.push(`M${c + QUIET} ${r + QUIET}h1v1h-1z`);
    return { size, d: parts.join(''), dark: parts.length };
  } catch {
    return null;
  }
}
