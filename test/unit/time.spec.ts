// time.spec.ts: Colombia fixed-offset conversions and Spanish slot labels.
import { describe, expect, it } from 'vitest';
import { formatSlotEs, fromLocal, localDateKey, parseClock, toLocalParts } from '@audiorapy/domain';

describe('time', () => {
  it('converts local Colombia time to UTC with a fixed -05:00 offset', () => {
    expect(fromLocal(2026, 10, 6, 9 * 60).toISOString()).toBe('2026-10-06T14:00:00.000Z');
  });

  it('reads local parts across the UTC date line', () => {
    const p = toLocalParts(new Date('2026-10-07T03:30:00Z'));
    expect(p).toMatchObject({ year: 2026, month: 10, day: 6, weekday: 2, minutes: 22 * 60 + 30 });
    expect(localDateKey(new Date('2026-10-07T03:30:00Z'))).toBe('2026-10-06');
  });

  it('parses clocks strictly', () => {
    expect(parseClock('08:30')).toBe(510);
    expect(parseClock('24:00')).toBeNull();
    expect(parseClock('8:30')).toBeNull();
  });

  it('formats slots in short Spanish within the 24-char list limit', () => {
    expect(formatSlotEs(fromLocal(2026, 10, 6, 9 * 60))).toBe('mar 6 oct · 9:00 a. m.');
    expect(formatSlotEs(fromLocal(2026, 9, 30, 12 * 60 + 30))).toBe('mié 30 sep · 12:30 p. m.');
    expect(formatSlotEs(fromLocal(2026, 9, 30, 12 * 60 + 30)).length).toBeLessThanOrEqual(24);
  });
});
