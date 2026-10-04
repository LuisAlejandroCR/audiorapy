// JourneyMap.tsx: the start route drawn as a quest map — done, current and locked nodes on a winding
// path, with points and rank. Each node says its state in text, not only in color.
import { useState } from 'react';
import type { Journey, StepId } from '../lib/journey.ts';
import { MAX_XP } from '../lib/journey.ts';
import { Icon } from './Icon.tsx';

const STEP_ICON: Record<StepId, string> = {
  vault: 'lock',
  recovery: 'key',
  patient: 'user',
  session: 'session',
  note: 'note',
  backup: 'download',
};

export function JourneyMap({ route, onGo }: { route: Journey; onGo: (step: StepId) => void }) {
  const complete = route.next === null;
  const [open, setOpen] = useState(!complete);
  const percent = Math.round((route.xp / MAX_XP) * 100);

  return (
    <section className="card journey" aria-labelledby="journey-title">
      <div className="journey-head">
        <div>
          <p className="eyebrow">Ruta de inicio</p>
          <h2 id="journey-title">
            {complete ? '¡Ruta completada!' : 'Tu primera consulta protegida'}
          </h2>
          <p className="muted">
            {route.completed} de {route.total} pasos · <strong>{route.xp}</strong> puntos ·{' '}
            {route.rank}
          </p>
        </div>
        {complete && (
          <button
            type="button"
            className="ghost"
            aria-expanded={open}
            aria-controls="journey-path"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Ocultar' : 'Ver ruta'}
          </button>
        )}
      </div>
      <div
        className="xp-bar"
        role="progressbar"
        aria-label="Puntos de la ruta"
        aria-valuemin={0}
        aria-valuemax={MAX_XP}
        aria-valuenow={route.xp}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      {open && (
        <ol className="quest-path" id="journey-path">
          {route.steps.map((s, i) => {
            const state = s.done ? 'done' : s.id === route.next ? 'current' : 'locked';
            const label = s.done ? 'Hecho' : state === 'current' ? 'Siguiente' : 'Pendiente';
            return (
              <li key={s.id} className={`quest-node ${state}`} data-side={i % 2 ? 'right' : 'left'}>
                <span className="node-orb" aria-hidden="true">
                  <Icon name={s.done ? 'check' : STEP_ICON[s.id]} />
                </span>
                <span className="node-copy">
                  <span className="node-state">
                    {label} · +{s.xp}
                  </span>
                  <strong>{s.title}</strong>
                  <span className="muted">{s.hint}</span>
                </span>
                {state === 'current' && s.id !== 'vault' && (
                  <button type="button" onClick={() => onGo(s.id)}>
                    Ir
                  </button>
                )}
              </li>
            );
          })}
          <li className={`quest-node goal ${complete ? 'done' : 'locked'}`} aria-label="Meta">
            <span className="node-orb" aria-hidden="true">
              <Icon name="trophy" />
            </span>
            <span className="node-copy">
              <span className="node-state">Meta</span>
              <strong>Consulta blindada</strong>
            </span>
          </li>
        </ol>
      )}
    </section>
  );
}
