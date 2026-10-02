// time.ts: Colombia local-time helpers. Colombia is UTC-5 all year (no DST), so a fixed offset is exact.

export const COLOMBIA_OFFSET_MINUTES = -300;
const OFFSET_MS = COLOMBIA_OFFSET_MINUTES * 60_000;
const MINUTE_MS = 60_000;

export interface LocalParts {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 0 = Sunday
  minutes: number; // minutes since local midnight
}

export function toLocalParts(instant: Date): LocalParts {
  const shifted = new Date(instant.getTime() + OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

/** The UTC instant for a local calendar date plus minutes since local midnight. */
export function fromLocal(year: number, month: number, day: number, minutes: number): Date {
  return new Date(Date.UTC(year, month - 1, day) + minutes * MINUTE_MS - OFFSET_MS);
}

export function localDateKey(instant: Date): string {
  const p = toLocalParts(instant);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Parses "HH:MM" into minutes since midnight, or null when malformed. */
export function parseClock(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * MINUTE_MS);
}

const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Short Spanish label for a slot, at most 24 characters (WhatsApp list row title limit). */
export function formatSlotEs(instant: Date): string {
  const p = toLocalParts(instant);
  const h24 = Math.floor(p.minutes / 60);
  const minute = p.minutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const suffix = h24 < 12 ? 'a. m.' : 'p. m.';
  return `${WEEKDAYS[p.weekday]} ${p.day} ${MONTHS[p.month - 1]} · ${h12}:${pad(minute)} ${suffix}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
