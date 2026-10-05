// ExecutiveSummary.tsx: the first card of "Hoy" — one sentence, four KPIs in urgency order, the accuracy
// trend as a sparkline (with a text equivalent) and the single next step, so the important comes first.
import type { Executive } from '../lib/summary.ts';
import { sparkline } from '../lib/summary.ts';
import { formatDayEs } from '../lib/stats.ts';
import { Icon } from './Icon.tsx';

const NEXT: Record<Executive['focus'], { label: string; hint: string } | null> = {
  alerts: { label: 'Responder avisos', hint: 'Hay familias esperando respuesta.' },
  confirm: { label: 'Revisar confirmaciones', hint: 'Visitas aún sin confirmar.' },
  notes: { label: 'Aprobar notas', hint: 'Sesiones con nota SOAP pendiente.' },
  session: { label: 'Registrar una sesión', hint: 'Todo al día: sigue con tu próxima visita.' },
  clear: null,
};

const W = 220;
const H = 56;

export function ExecutiveSummary({
  summary,
  onNext,
}: {
  summary: Executive;
  onNext: (focus: Executive['focus']) => void;
}) {
  const next = NEXT[summary.focus];
  const values = summary.trend.map((p) => p.percent);
  const last = summary.trend.at(-1);
  const tiles = [
    { label: 'Avisos', value: summary.openAlerts, icon: 'bell', warn: summary.openAlerts > 0 },
    {
      label: 'Por confirmar',
      value: summary.toConfirm,
      icon: 'check',
      warn: summary.toConfirm > 0,
    },
    { label: 'Próximos 7 días', value: summary.next7Days, icon: 'calendar', warn: false },
    {
      label: 'Notas pendientes',
      value: summary.pendingNotes,
      icon: 'note',
      warn: summary.pendingNotes > 0,
    },
  ];

  return (
    <section className="card exec reveal" aria-labelledby="exec-title">
      <div className="exec-top">
        <div>
          <p className="eyebrow">Resumen ejecutivo</p>
          <h2 id="exec-title">Lo importante primero</h2>
          <p className="exec-headline">{summary.headline}</p>
        </div>
        {last && (
          <figure className="exec-chart">
            <svg
              viewBox={`-4 -4 ${W + 8} ${H + 8}`}
              role="img"
              aria-label={`Tendencia de acierto: ${values.join(', ')} %`}
            >
              <polyline className="spark" points={sparkline(values, W, H)} />
              {values.length > 0 && (
                <circle
                  className="spark-dot"
                  cx={values.length === 1 ? 0 : W}
                  cy={H - (last.percent / 100) * H}
                  r={4}
                />
              )}
            </svg>
            <figcaption>
              <strong>{last.percent} %</strong>
              <span>
                acierto · {formatDayEs(last.date)}
                {summary.delta !== null &&
                  ` · ${summary.delta > 0 ? '▲' : summary.delta < 0 ? '▼' : '='} ${Math.abs(summary.delta)} pts`}
              </span>
            </figcaption>
          </figure>
        )}
      </div>
      <ul className="exec-tiles">
        {tiles.map((t, i) => (
          <li
            key={t.label}
            className={t.warn ? 'warn' : undefined}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <Icon name={t.icon} />
            <strong>{t.value}</strong>
            <span>{t.label}</span>
          </li>
        ))}
      </ul>
      {next && (
        <div className="exec-next">
          <span>
            <strong>Siguiente paso:</strong> {next.hint}
          </span>
          <button type="button" onClick={() => onNext(summary.focus)}>
            {next.label} →
          </button>
        </div>
      )}
    </section>
  );
}
