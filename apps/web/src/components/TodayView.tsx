// TodayView.tsx: the scheduling plane from the API — upcoming visits, confirmation state and alerts.
// When the API is unreachable it says so and the rest of the dashboard keeps working.
import { useCallback, useEffect, useState } from 'react';
import type { PortResult } from '@audiorapy/domain';
import { ALERT_ES, fetchAgenda, STATUS_ES, type Agenda } from '../lib/agenda.ts';
import { loadApiSettings } from '../lib/settings.ts';

export function TodayView() {
  const [result, setResult] = useState<PortResult<Agenda> | null>(null);

  const refresh = useCallback(async () => {
    setResult(null);
    setResult(await fetchAgenda(loadApiSettings()));
  }, []);

  useEffect(() => {
    let live = true;
    fetchAgenda(loadApiSettings()).then((r) => live && setResult(r));
    return () => {
      live = false;
    };
  }, []);

  return (
    <section className="card" aria-labelledby="today-title">
      <div className="row between">
        <h2 id="today-title">Agenda</h2>
        <button type="button" className="ghost" onClick={refresh}>
          Actualizar
        </button>
      </div>
      {result === null && <p aria-busy="true">Cargando agenda…</p>}
      {result && !result.available && (
        <p role="status" className="banner warn">
          Agenda no disponible: {result.error}. Configúrala en Respaldo → Conexiones. Las notas
          clínicas siguen disponibles.
        </p>
      )}
      {result?.available && <AgendaList agenda={result.data} />}
    </section>
  );
}

function AgendaList({ agenda }: { agenda: Agenda }) {
  const upcoming = agenda.appointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed',
  );
  const open = agenda.alerts.filter((a) => !a.resolved);
  return (
    <>
      {open.length > 0 && (
        <div className="alerts" aria-label="Avisos">
          <h3>Requieren tu atención</h3>
          <ul>
            {open.map((a) => (
              <li key={a.id}>
                <strong>{ALERT_ES[a.reason] ?? a.reason}</strong> · familia {a.contact}
              </li>
            ))}
          </ul>
        </div>
      )}
      {upcoming.length === 0 ? (
        <p className="muted">No hay visitas próximas.</p>
      ) : (
        <ul className="visits">
          {upcoming.map((a) => (
            <li key={a.id} data-status={a.status}>
              <span className="when">{a.label}</span>
              <span className="who">Familia {a.contact}</span>
              <span className={`pill ${a.status}`}>{STATUS_ES[a.status] ?? a.status}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
