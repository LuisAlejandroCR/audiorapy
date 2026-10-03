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
    <section className="today" aria-labelledby="today-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Panel diario</p>
          <h2 id="today-title">Tu agenda de hoy</h2>
          <p className="muted">Visitas y asuntos que necesitan tu atención.</p>
        </div>
        <button type="button" className="ghost" onClick={refresh}>
          <span aria-hidden="true">↻</span>
          Actualizar
        </button>
      </div>
      {result === null && (
        <div className="card loading-card" aria-busy="true">
          <span className="spinner" aria-hidden="true" />
          <span>Cargando agenda…</span>
        </div>
      )}
      {result && !result.available && (
        <div role="status" className="card unavailable">
          <span className="status-icon" aria-hidden="true">
            !
          </span>
          <div>
            <h3>Agenda no disponible: {result.error}</h3>
            <p>Configúrala en Respaldo → Conexiones.</p>
            <p className="muted">Tus notas clínicas siguen disponibles en este dispositivo.</p>
          </div>
        </div>
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
  const pending = upcoming.filter((a) => a.status === 'scheduled').length;
  return (
    <>
      <div className="agenda-summary" aria-label="Resumen de agenda">
        <article className="summary-card primary">
          <span className="summary-label">Próxima visita</span>
          <strong>{upcoming[0]?.label ?? 'Sin visitas próximas'}</strong>
          <span>{upcoming[0] ? `Familia ${upcoming[0].contact}` : 'Tu agenda está libre'}</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Próximas</span>
          <strong>{upcoming.length}</strong>
          <span>{upcoming.length === 1 ? 'visita agendada' : 'visitas agendadas'}</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Por confirmar</span>
          <strong>{pending}</strong>
          <span>{pending === 1 ? 'familia pendiente' : 'familias pendientes'}</span>
        </article>
      </div>
      {open.length > 0 && (
        <div className="alerts card" aria-label="Avisos">
          <div className="alert-heading">
            <span className="status-icon" aria-hidden="true">
              !
            </span>
            <div>
              <p className="eyebrow">Pendiente</p>
              <h3>Requiere tu atención</h3>
            </div>
          </div>
          <ul>
            {open.map((a) => (
              <li key={a.id}>
                <strong>{ALERT_ES[a.reason] ?? a.reason}</strong>
                <span>Familia {a.contact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {upcoming.length === 0 ? (
        <div className="card empty agenda-empty">
          <span className="empty-icon" aria-hidden="true">
            ✓
          </span>
          <h3>Todo despejado</h3>
          <p className="muted">No hay visitas próximas.</p>
        </div>
      ) : (
        <section className="card schedule" aria-labelledby="upcoming-title">
          <div className="schedule-heading">
            <div>
              <p className="eyebrow">Agenda</p>
              <h3 id="upcoming-title">Próximas visitas</h3>
            </div>
            <span className="muted">{upcoming.length} en total</span>
          </div>
          <ul className="visits">
            {upcoming.map((a) => (
              <li key={a.id} data-status={a.status}>
                <span className="timeline-dot" aria-hidden="true" />
                <span className="visit-copy">
                  <span className="when">{a.label}</span>
                  <span className="who">Familia {a.contact}</span>
                </span>
                <span className={`pill ${a.status}`}>{STATUS_ES[a.status] ?? a.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
