// slots.ts: deterministic slot finder for home visits. Pure: same input, same offer.
import {
  addMinutes,
  formatSlotEs,
  fromLocal,
  localDateKey,
  parseClock,
  toLocalParts,
} from './time.ts';

export type PartOfDay = 'morning' | 'afternoon' | 'evening';

export interface WeeklyWindow {
  weekday: number; // 0 = Sunday, local time
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface Interval {
  startsAt: string; // ISO instant
  endsAt: string;
}

export interface SlotPreference {
  weekday?: number;
  partOfDay?: PartOfDay;
}

export interface SlotQuery {
  now: Date;
  windows: WeeklyWindow[];
  busy: Interval[];
  durationMinutes: number;
  bufferMinutes: number;
  minLeadMinutes: number;
  horizonDays: number;
  stepMinutes: number;
  limit: number;
  holidays?: string[]; // local dates, YYYY-MM-DD
  preference?: SlotPreference;
}

export interface Slot {
  startsAt: string;
  endsAt: string;
  label: string;
}

export interface SlotOffer {
  slots: Slot[];
  /** False when the preference matched nothing and the offer ignores it. */
  preferenceHonored: boolean;
}

const MAX_HORIZON_DAYS = 60;
const MAX_LIMIT = 10;

export function partOfDay(minutesSinceMidnight: number): PartOfDay {
  if (minutesSinceMidnight < 12 * 60) return 'morning';
  if (minutesSinceMidnight < 18 * 60) return 'afternoon';
  return 'evening';
}

export function findSlots(query: SlotQuery): SlotOffer {
  const candidates = candidateSlots(query);
  const preferred = query.preference
    ? candidates.filter((c) => matchesPreference(c, query.preference!))
    : candidates;
  const preferenceHonored = !query.preference || preferred.length > 0;
  const pool = preferenceHonored ? preferred : candidates;
  return { slots: spreadAcrossDays(pool, clampInt(query.limit, 0, MAX_LIMIT)), preferenceHonored };
}

function candidateSlots(q: SlotQuery): Slot[] {
  const duration = clampInt(q.durationMinutes, 5, 8 * 60);
  const step = clampInt(q.stepMinutes, 5, 24 * 60);
  const buffer = clampInt(q.bufferMinutes, 0, 4 * 60);
  const horizon = clampInt(q.horizonDays, 0, MAX_HORIZON_DAYS);
  const earliest = addMinutes(q.now, Math.max(0, q.minLeadMinutes)).getTime();
  const holidays = new Set(q.holidays ?? []);
  const busy = q.busy
    .map((b) => ({ start: Date.parse(b.startsAt), end: Date.parse(b.endsAt) }))
    .filter((b) => Number.isFinite(b.start) && Number.isFinite(b.end) && b.end > b.start);

  const today = toLocalParts(q.now);
  const out: Slot[] = [];
  const seen = new Set<number>();

  for (let offset = 0; offset <= horizon; offset++) {
    const dayStart = fromLocal(today.year, today.month, today.day + offset, 0);
    if (holidays.has(localDateKey(dayStart))) continue;
    const { year, month, day, weekday } = toLocalParts(dayStart);

    for (const window of q.windows) {
      if (window.weekday !== weekday) continue;
      const open = parseClock(window.start);
      const close = parseClock(window.end);
      if (open === null || close === null || close <= open) continue;

      for (let m = open; m + duration <= close; m += step) {
        const start = fromLocal(year, month, day, m);
        const startMs = start.getTime();
        const endMs = startMs + duration * 60_000;
        if (startMs < earliest || seen.has(startMs)) continue;
        const clashes = busy.some(
          (b) => startMs < b.end + buffer * 60_000 && endMs + buffer * 60_000 > b.start,
        );
        if (clashes) continue;
        seen.add(startMs);
        out.push({
          startsAt: start.toISOString(),
          endsAt: new Date(endMs).toISOString(),
          label: formatSlotEs(start),
        });
      }
    }
  }
  return out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function matchesPreference(slot: Slot, pref: SlotPreference): boolean {
  const p = toLocalParts(new Date(slot.startsAt));
  if (pref.weekday !== undefined && p.weekday !== pref.weekday) return false;
  if (pref.partOfDay !== undefined && partOfDay(p.minutes) !== pref.partOfDay) return false;
  return true;
}

/** Offers the earliest slot of each day first, so three options are three different days when possible. */
function spreadAcrossDays(sorted: Slot[], limit: number): Slot[] {
  const picked: Slot[] = [];
  const days = new Set<string>();
  for (const slot of sorted) {
    if (picked.length >= limit) break;
    const key = localDateKey(new Date(slot.startsAt));
    if (days.has(key)) continue;
    days.add(key);
    picked.push(slot);
  }
  for (const slot of sorted) {
    if (picked.length >= limit) break;
    if (!picked.includes(slot)) picked.push(slot);
  }
  return picked.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
