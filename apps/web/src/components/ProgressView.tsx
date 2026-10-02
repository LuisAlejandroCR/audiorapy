// ProgressView.tsx: single-case progress per target — percent correct per session, each point colored
// by the dominant cue level, with the criterion line. A table carries the same data for screen readers.
import { useState } from 'react';
import { CUE_LABEL_ES, CUE_LEVELS, type CueLevel } from '@audiorapy/domain';
import { progressSeries, type ProgressSeries } from '../lib/progress.ts';
import { byKind, type ClinicalRecord } from '../lib/records.ts';

export function ProgressView({ records }: { records: ClinicalRecord[] }) {
  const patients = byKind(records, 'patient');
  const sessions = byKind(records, 'session');
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '');
  const patient = patients.find((p) => p.id === patientId) ?? patients[0];
  const series = patient ? progressSeries(patient, sessions) : [];
  if (!patient) return null;

  return (
    <section className="card" aria-labelledby="progress-title">
      <div className="row between">
        <h2 id="progress-title">Progreso por objetivo</h2>
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
      <p className="muted">
        {patient.alias}
        {patient.synthetic && <span className="tag">datos sintéticos</span>}
      </p>
      <Legend />
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

  return (
    <figure className="chart">
      <figcaption>
        <strong>{series.label}</strong>
        {last && (
          <span className="muted">
            {' '}
            · última: {last.percent} % con apoyo{' '}
            {last.dominantCue ? CUE_LABEL_ES[last.dominantCue] : '—'}
          </span>
        )}
      </figcaption>
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
        <path className="trend" d={path} />
        {pts.map((p, i) => (
          <circle
            key={p.sessionId}
            className={`cue-${p.dominantCue ?? 'none'}`}
            cx={x(i)}
            cy={y(p.percent)}
            r={5}
          >
            <title>{`${p.date}: ${p.percent} %, apoyo ${p.dominantCue ? CUE_LABEL_ES[p.dominantCue] : '—'}`}</title>
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
                <td>{p.date}</td>
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
