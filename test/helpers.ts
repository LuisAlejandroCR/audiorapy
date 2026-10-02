// helpers.ts: shared fixtures for the domain tests. Synthetic data only.
import type { CatalogueContext, SlotQuery, StepContext, Slot, Intent } from '@audiorapy/domain';
import { fromLocal } from '@audiorapy/domain';

export const FAST_KDF = { alg: 'argon2id', t: 1, m: 64, p: 1 } as const;

export const catalogue: CatalogueContext = {
  practiceName: 'Consultorio de prueba',
  privacyUrl: 'https://example.org/privacidad',
};

/** Thursday 2026-10-01 08:00 Colombia time. */
export const THURSDAY_8AM = fromLocal(2026, 10, 1, 8 * 60);

export function baseQuery(overrides: Partial<SlotQuery> = {}): SlotQuery {
  return {
    now: THURSDAY_8AM,
    windows: [1, 2, 3, 4, 5].flatMap((weekday) => [
      { weekday, start: '08:00', end: '12:00' },
      { weekday, start: '14:00', end: '18:00' },
    ]),
    busy: [],
    durationMinutes: 45,
    bufferMinutes: 30,
    minLeadMinutes: 12 * 60,
    horizonDays: 14,
    stepMinutes: 30,
    limit: 3,
    ...overrides,
  };
}

export function slot(startsAt: string): Slot {
  return { startsAt, endsAt: startsAt, label: 'x' };
}

export function ctx(intent: Intent = { kind: 'unknown' }, slots: Slot[] = []): StepContext {
  return { intent, offer: { slots, preferenceHonored: true }, catalogue };
}
