// stats.ts: figures the dashboard shows as KPIs and session feedback — live streak and trial goal in
// session mode, mastery runs per target, caseload KPIs and local-time dates. Code computes; no model.
import { progressSeries } from './progress.ts';
import { localDay, type Note, type Patient, type Session } from './records.ts';

/** Trials per target that make a block worth reading against the criterion. */
export const TRIAL_GOAL = 10;
/** Consecutive sessions at or above criterion that count as mastery. */
export const MASTERY_RUN = 3;

export interface LiveStats {
  count: number;
  correct: number;
  percent: number;
  /** Consecutive correct trials ending at the last trial. */
  streak: number;
  bestStreak: number;
  /** 0..1 progress toward TRIAL_GOAL. */
  goal: number;
  criterionMet: boolean;
}

export function liveStats(
  outcomes: readonly boolean[],
  criterionPercent: number,
  goal = TRIAL_GOAL,
): LiveStats {
  let streak = 0;
  let bestStreak = 0;
  let correct = 0;
  for (const ok of outcomes) {
    if (ok) {
      correct++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);
    } else streak = 0;
  }
  const count = outcomes.length;
  const percent = count === 0 ? 0 : Math.round((correct / count) * 100);
  const safeGoal = Math.max(1, Math.floor(goal));
  return {
    count,
    correct,
    percent,
    streak,
    bestStreak,
    goal: Math.min(1, count / safeGoal),
    criterionMet: count >= safeGoal && percent >= criterionPercent,
  };
}

/** How many of the most recent percents in a row are at or above the criterion. */
export function masteryRun(percents: readonly number[], criterionPercent: number): number {
  let run = 0;
  for (let i = percents.length - 1; i >= 0 && percents[i]! >= criterionPercent; i--) run++;
  return run;
}

export interface CaseloadKpis {
  sessions: number;
  sessionsLast30: number;
  /** Mean of each target's latest percent, or null with no data. */
  latestAccuracy: number | null;
  mastered: number;
  targets: number;
  pendingNotes: number;
}

export function caseloadKpis(
  patient: Patient,
  sessions: readonly Session[],
  notes: readonly Note[],
  today: Date,
): CaseloadKpis {
  const own = sessions.filter((s) => s.patientId === patient.id);
  const series = progressSeries(patient, [...own]);
  const latest = series.flatMap((s) => (s.points.length ? [s.points.at(-1)!.percent] : []));
  const since = localDate(new Date(today.getTime() - 30 * 86_400_000));
  const noted = new Set(notes.map((n) => n.sessionId));
  return {
    sessions: own.length,
    sessionsLast30: own.filter((s) => s.date >= since).length,
    latestAccuracy: latest.length
      ? Math.round(latest.reduce((a, b) => a + b, 0) / latest.length)
      : null,
    mastered: series.filter(
      (s) =>
        masteryRun(
          s.points.map((p) => p.percent),
          s.criterionPercent,
        ) >= MASTERY_RUN,
    ).length,
    targets: series.length,
    pendingNotes: own.filter((s) => !noted.has(s.id) && s.targets.some((t) => t.trials.length > 0))
      .length,
  };
}

/** YYYY-MM-DD in the device's own time zone (a session at 8 p.m. in Bogotá is still today). */
export const localDate = localDay;

const DATE_ES = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Formats a stored YYYY-MM-DD as "sáb, 3 oct 2026"; anything else is returned unchanged. */
export function formatDayEs(day: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  const d = new Date(`${day}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? day : DATE_ES.format(d).replace(/\./g, '');
}

const STAMP_ES = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

/** An ISO instant in the device's local time, e.g. an approval stamp. */
export function formatStampEs(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : STAMP_ES.format(d);
}
