// ProgressView.tsx: single-case progress per target — percent correct per session, each point colored
// by the dominant cue level, with the criterion line. A table carries the same data for screen readers.
import { useState } from 'react';
import { CUE_LABEL_ES, CUE_LEVELS, type CueLevel } from '@audiorapy/domain';
import { progressSeries, type ProgressSeries } from '../lib/progress.ts';
import { byKind, type ClinicalRecord } from '../lib/records.ts';
import { caseloadKpis, formatDayEs, MASTERY_RUN, masteryRun } from '../lib/stats.ts';
import { Icon } from './Icon.tsx';
import { Kpi } from './Kpi.tsx';

export function ProgressView({ records }: { records: ClinicalRecord[] }) {
  const patients = byKind(records, 'patient');
  const sessions = byKind(records, 'session');
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '');
  const patient = patients.find((p) => p.id === patientId) ?? patients[0];
  const series = patient ? progressSeries(patient, sessions) : [];
  const [today] = useState(() => new Date());
  if (!patient) return null;
  const kpi = caseloadKpis(patient, sessions, byKind(records, 'soap_note'), today);

  return (
    <section className="card progress-view" aria-labelledby="progress-title">
      <div className="section-heading progress-heading">
        <div>
          <p className="eyebrow">Evolución clínica</p>
          <h2 id="progress-title">Progreso por objetivo</h2>
          <p className="muted">Tendencias por sesión y nivel de apoyo.</p>
        </div>
        {patients.length > 1 && (
          <select
            aria-label="Paciente"
            value={patient.id}
            onChange={(e) => setPatientId(e.target.value)}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.alias}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="patient-context">
        <span className="patient-avatar" aria-hidden="true">
          {patient.alias.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <strong>{patient.alias}</strong>
          <span>
            {series.length} {series.length === 1 ? 'objetivo' : 'objetivos'} en seguimiento
          </span>
        </div>
        {patient.synthetic && <span className="tag">datos sintéticos</span>}
      </div>
      <div className="kpi-grid compact" aria-label="Indicadores del caso">
        <Kpi
          icon="session"
          label="Sesiones"
          value={kpi.sessions}
          unit={`${kpi.sessionsLast30} en 30 días`}
        />
        <Kpi
          icon="target"
          label="Acierto actual"
          value={kpi.latestAccuracy === null ? '—' : `${kpi.latestAccuracy} %`}
          unit="promedio de la última sesión"
          meter={kpi.latestAccuracy ?? 0}
        />
        <Kpi
          icon="trophy"
          label="Objetivos dominados"
          value={`${kpi.mastered}/${kpi.targets}`}
          unit={`${MASTERY_RUN} sesiones seguidas sobre la meta`}
          tone={kpi.mastered > 0 ? 'ok' : undefined}
        />
        <Kpi
          icon="note"
          label="Notas pendientes"
          value={kpi.pendingNotes}
          unit={kpi.pendingNotes === 0 ? 'todo aprobado' : 'sesiones sin nota SOAP'}
          tone={kpi.pendingNotes > 0 ? 'warn' : 'ok'}
        />
      </div>
      <div className="legend-panel">
        <span className="legend-title">Nivel de apoyo</span>
        <Legend />
      </div>
      <div className="charts">
        {series.map((s) => (
          <TargetChart key={s.targetId} series={s} />
        ))}
      </div>
    </section>
  );
}

function Legend() {
  return (
    <ul className="legend" aria-label="Nivel de apoyo">
      {CUE_LEVELS.map((c) => (
        <li key={c}>
          <span className={`dot cue-${c}`} aria-hidden="true" />
          {CUE_LABEL_ES[c]}
        </li>
      ))}
    </ul>
  );
}

const W = 320;
const H = 160;
const PAD = { l: 34, r: 10, t: 12, b: 24 };

function TargetChart({ series }: { series: ProgressSeries }) {
  const pts = series.points;
  const x = (i: number) =>
    PAD.l + (pts.length <= 1 ? 0 : (i / (pts.length - 1)) * (W - PAD.l - PAD.r));
  const y = (p: number) => PAD.t + (1 - p / 100) * (H - PAD.t - PAD.b);
  const path = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.percent).toFixed(1)}`)
    .join(' ');
  const last = pts.at(-1);
  const run = masteryRun(
    pts.map((p) => p.percent),
    series.criterionPercent,
  );

  return (
    <figure className="chart chart-card">
      <figcaption>
        <span className="target-label">{series.label}</span>
        {last && (
          <span className="chart-result">
            <strong>{last.percent} %</strong>
            <small>apoyo {last.dominantCue ? CUE_LABEL_ES[last.dominantCue] : '—'}</small>
          </span>
        )}
      </figcaption>
      {run >= MASTERY_RUN ? (
        <p className="badge ok">
          <Icon name="trophy" /> Dominado · {run} sesiones seguidas ≥ {series.criterionPercent} %
        </p>
      ) : run > 0 ? (
        <p className="badge">
          <Icon name="flame" /> Racha {run}/{MASTERY_RUN} sobre la meta
        </p>
      ) : null}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Porcentaje de acierto por sesión en ${series.label}`}
      >
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line className="grid" x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} />
            <text className="axis" x={PAD.l - 6} y={y(g) + 4} textAnchor="end">
              {g}
            </text>
          </g>
        ))}
        <line
          className="criterion"
          x1={PAD.l}
          x2={W - PAD.r}
          y1={y(series.criterionPercent)}
          y2={y(series.criterionPercent)}
        />
        <text
          className="axis criterion-label"
          x={PAD.l + 4}
          y={y(series.criterionPercent) - 4}
          textAnchor="start"
        >
          meta {series.criterionPercent} %
        </text>
        <path className="trend" d={path} />
        {pts.map((p, i) => (
          <circle
            key={p.sessionId}
            className={`cue-${p.dominantCue ?? 'none'}`}
            cx={x(i)}
            cy={y(p.percent)}
            r={5}
          >
            <title>{`${formatDayEs(p.date)}: ${p.percent} %, apoyo ${p.dominantCue ? CUE_LABEL_ES[p.dominantCue] : '—'}`}</title>
          </circle>
        ))}
      </svg>
      <details>
        <summary>Ver datos</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Acierto</th>
              <th scope="col">Ensayos</th>
              <th scope="col">Apoyo</th>
            </tr>
          </thead>
          <tbody>
            {pts.map((p) => (
              <tr key={p.sessionId}>
                <td>{formatDayEs(p.date)}</td>
                <td>{p.percent} %</td>
                <td>{p.total}</td>
                <td>{p.dominantCue ? CUE_LABEL_ES[p.dominantCue as CueLevel] : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
