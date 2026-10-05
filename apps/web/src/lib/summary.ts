// summary.ts: the executive summary that opens "Hoy" — the few numbers that matter first, one plain
// sentence built by code (never by a model), an accuracy trend for a sparkline, and which alerts are new
// since the last look (for notifications).
import { agendaKpis, type Agenda } from './agenda.ts';
import { progressSeries } from './progress.ts';
import { byKind, type ClinicalRecord } from './records.ts';

export interface TrendPoint {
  date: string;
  percent: number;
}

export interface Executive {
  next7Days: number;
  toConfirm: number;
  openAlerts: number;
  pendingNotes: number;
  /** Mean accuracy across targets per session, oldest first (last 8 sessions). */
  trend: TrendPoint[];
  /** Change of the last point against the one before, in percentage points, or null. */
  delta: number | null;
  headline: string;
  /** What to do first, in order of urgency. */
  focus: 'alerts' | 'confirm' | 'notes' | 'session' | 'clear';
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function executiveSummary(
  agenda: Agenda | null,
  records: readonly ClinicalRecord[],
  now: Date,
): Executive {
  const k = agenda ? agendaKpis(agenda, now) : null;
  const patients = byKind([...records], 'patient');
  const sessions = byKind([...records], 'session');
  const noted = new Set(byKind([...records], 'soap_note').map((n) => n.sessionId));
  const pendingNotes = sessions.filter(
    (s) => !noted.has(s.id) && s.targets.some((t) => t.trials.length > 0),
  ).length;

  const byDate = new Map<string, number[]>();
  for (const p of patients)
    for (const series of progressSeries(p, sessions))
      for (const pt of series.points)
        byDate.set(pt.date, [...(byDate.get(pt.date) ?? []), pt.percent]);
  const trend = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([date, xs]) => ({
      date,
      percent: Math.round(xs.reduce((a, b) => a + b, 0) / xs.length),
    }));
  const delta = trend.length >= 2 ? trend.at(-1)!.percent - trend.at(-2)!.percent : null;

  const next7Days = k?.next7Days ?? 0;
  const toConfirm = k ? k.upcoming - k.confirmed : 0;
  const openAlerts = k?.openAlerts ?? 0;
  const focus: Executive['focus'] =
    openAlerts > 0
      ? 'alerts'
      : toConfirm > 0
        ? 'confirm'
        : pendingNotes > 0
          ? 'notes'
          : patients.length > 0
            ? 'session'
            : 'clear';

  const parts = [
    k ? plural(next7Days, 'visita en 7 días', 'visitas en 7 días') : 'agenda sin conectar',
    k ? plural(toConfirm, 'por confirmar', 'por confirmar') : null,
    k ? plural(openAlerts, 'aviso', 'avisos') : null,
    plural(pendingNotes, 'nota pendiente', 'notas pendientes'),
  ].filter(Boolean);
  const accuracy = trend.length
    ? ` Acierto promedio ${trend.at(-1)!.percent} %${
        delta === null
          ? ''
          : delta === 0
            ? ', estable'
            : `, ${delta > 0 ? '+' : '−'}${Math.abs(delta)} pts`
      }.`
    : '';
  return {
    next7Days,
    toConfirm,
    openAlerts,
    pendingNotes,
    trend,
    delta,
    headline: `${parts.join(' · ')}.${accuracy}`,
    focus,
  };
}

/** Open alerts not seen before — what deserves a notification. */
export function newAlertIds(seen: ReadonlySet<string>, agenda: Agenda): string[] {
  return agenda.alerts.filter((a) => !a.resolved && !seen.has(a.id)).map((a) => a.id);
}

/** SVG polyline points for a sparkline of `values` (0–100) in a `w`×`h` box. */
export function sparkline(values: readonly number[], w: number, h: number): string {
  if (values.length === 0) return '';
  const clamp = (v: number) => Math.min(100, Math.max(0, Number.isFinite(v) ? v : 0));
  const step = values.length === 1 ? 0 : w / (values.length - 1);
  return values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (clamp(v) / 100) * h).toFixed(1)}`)
    .join(' ');
}
