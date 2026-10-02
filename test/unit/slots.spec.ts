// slots.spec.ts: slot offers respect lead time, busy visits with travel buffer, holidays and preferences.
import { describe, expect, it } from 'vitest';
import { findSlots, fromLocal } from '@audiorapy/domain';
import { baseQuery } from '../helpers.ts';

describe('findSlots', () => {
  it('offers three slots on three different days, earliest first', () => {
    const { slots, preferenceHonored } = findSlots(baseQuery());
    expect(preferenceHonored).toBe(true);
    expect(slots.map((s) => s.startsAt)).toEqual([
      '2026-10-02T13:00:00.000Z', // Fri 08:00 — Thursday is inside the 12 h lead
      '2026-10-05T13:00:00.000Z', // Mon 08:00
      '2026-10-06T13:00:00.000Z', // Tue 08:00
    ]);
  });

  it('keeps the travel buffer around existing visits', () => {
    const busy = [
      {
        startsAt: fromLocal(2026, 10, 2, 8 * 60).toISOString(),
        endsAt: fromLocal(2026, 10, 2, 9 * 60).toISOString(),
      },
    ];
    const { slots } = findSlots(baseQuery({ busy, limit: 10 }));
    const friday = slots.filter((s) => s.startsAt.startsWith('2026-10-02'));
    expect(friday[0]?.startsAt).toBe(fromLocal(2026, 10, 2, 9 * 60 + 30).toISOString());
  });

  it('skips holidays', () => {
    const { slots } = findSlots(baseQuery({ holidays: ['2026-10-02'], limit: 10 }));
    expect(slots.some((s) => s.startsAt.startsWith('2026-10-02'))).toBe(false);
  });

  it('honors a weekday + part-of-day preference', () => {
    const { slots, preferenceHonored } = findSlots(
      baseQuery({ preference: { weekday: 3, partOfDay: 'afternoon' } }),
    );
    expect(preferenceHonored).toBe(true);
    expect(slots[0]?.label).toBe('mié 7 oct · 2:00 p. m.');
  });

  it('falls back to the earliest slots when the preference matches nothing', () => {
    const { slots, preferenceHonored } = findSlots(baseQuery({ preference: { weekday: 0 } }));
    expect(preferenceHonored).toBe(false);
    expect(slots).toHaveLength(3);
  });

  it('ignores malformed windows instead of throwing', () => {
    const { slots } = findSlots(
      baseQuery({
        windows: [
          { weekday: 1, start: '18:00', end: '08:00' },
          { weekday: 1, start: 'xx', end: '10:00' },
        ],
      }),
    );
    expect(slots).toEqual([]);
  });
});
