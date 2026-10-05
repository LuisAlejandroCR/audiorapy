// TodayView.tsx: "Hoy" — the executive summary first, then the start route, then the scheduling plane:
// KPI cards, upcoming visits and alerts the therapist can mark as handled, with opt-in notifications. When the API is unreachable it says so and the rest works.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { PortResult } from '@audiorapy/domain';
import {
  agendaKpis,
  ALERT_ES,
  fetchAgenda,
  resolveAlert,
  STATUS_ES,
  type Agenda,
} from '../lib/agenda.ts';
import { loadApiSettings } from '../lib/settings.ts';
import { formatStampEs } from '../lib/stats.ts';
import { Icon } from './Icon.tsx';
import { Kpi } from './Kpi.tsx';
import { Directions } from './Directions.tsx';
import { loadBook, saveAddress } from '../lib/maps.ts';
import { executiveSummary, newAlertIds, type Executive } from '../lib/summary.ts';
import type { ClinicalRecord } from '../lib/records.ts';
import { notificationsSupported, showNotification } from '../lib/notify.ts';
import { ExecutiveSummary } from './ExecutiveSummary.tsx';

export function TodayView({
  records,
  onConfigure,
  onNext,
  notify,
  onToggleNotify,
  onAgenda,
  children,
}: {
  records: ClinicalRecord[];
  notify: boolean;
  onToggleNotify: () => void;
  onAgenda: (agenda: Agenda) => void;
  onConfigure: () => void;
  onNext: (focus: Executive['focus']) => void;
  children?: ReactNode;
}) {
  const [result, setResult] = useState<PortResult<Agenda> | null>(null);
  const [now] = useState(() => new Date());
  const seen = useRef<Set<string> | null>(null);

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

  // With notifications on, the agenda is re-read every minute; a new open alert raises one notification.
  useEffect(() => {
    if (!notify) return;
    const id = setInterval(() => {
      void fetchAgenda(loadApiSettings()).then((r) => r.available && setResult(r));
    }, 60_000);
    return () => clearInterval(id);
  }, [notify]);

  useEffect(() => {
    if (!result?.available) return;
    onAgenda(result.data);
    const fresh = newAlertIds(seen.current ?? new Set(), result.data);
    if (seen.current && notify && fresh.length > 0) {
      for (const alert of result.data.alerts.filter((x) => fresh.includes(x.id)))
        showNotification(`${ALERT_ES[alert.reason] ?? 'Aviso'} · Familia ${alert.contact}`);
    }
    seen.current = new Set([...(seen.current ?? []), ...result.data.alerts.map((x) => x.id)]);
    const open = result.data.alerts.filter((x) => !x.resolved).length;
    document.title = open > 0 ? `(${open}) Audiorapy · Panel` : 'Audiorapy · Panel';
  }, [result, notify, onAgenda]);

  const summary = useMemo(
    () => executiveSummary(result?.available ? result.data : null, records, now),
    [result, records, now],
  );

  return (
    <section className="today" aria-labelledby="today-title">
      {result !== null && <ExecutiveSummary summary={summary} onNext={onNext} />}
      {children}
      <div className="section-heading">
        <div>
          <p className="eyebrow">Panel diario</p>
          <h2 id="today-title">Tu agenda</h2>
          <p className="muted">Próximas visitas y asuntos que necesitan tu atención.</p>
        </div>
        <div className="heading-actions">
          {notificationsSupported() && (
            <button type="button" className="ghost" aria-pressed={notify} onClick={onToggleNotify}>
              <Icon name="bell" />
              {notify ? 'Avisos activos' : 'Activar avisos'}
            </button>
          )}
          <button type="button" className="ghost" onClick={refresh} aria-label="Actualizar agenda">
            <span aria-hidden="true">↻</span>
            Actualizar
          </button>
        </div>
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
            <p className="muted">Tus notas clínicas siguen disponibles en este dispositivo.</p>
            <button type="button" className="ghost" onClick={onConfigure}>
              Configurar conexión
            </button>
          </div>
        </div>
      )}
      {result?.available && <AgendaList agenda={result.data} onChanged={refresh} />}
    </section>
  );
}

function AgendaList({ agenda, onChanged }: { agenda: Agenda; onChanged: () => void }) {
  const [now] = useState(() => new Date());
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState(loadBook);
  const kpi = agendaKpis(agenda, now);
  const upcoming = agenda.appointments
    .filter(
      (a) =>
        (a.status === 'scheduled' || a.status === 'confirmed') &&
        !(Date.parse(a.startsAt) < now.getTime()),
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const open = agenda.alerts.filter((a) => !a.resolved);
  const pending = upcoming.length - kpi.confirmed;

  const resolve = async (id: string) => {
    setResolving(id);
    setError(null);
    const r = await resolveAlert(loadApiSettings(), id);
    setResolving(null);
    if (r.available) onChanged();
    else setError(`No se pudo marcar: ${r.error}`);
  };

  return (
    <>
      <div className="kpi-grid" aria-label="Resumen de agenda">
        <article className="summary-card primary">
          <span className="summary-label">Próxima visita</span>
          <strong>{upcoming[0]?.label ?? 'Sin visitas próximas'}</strong>
          <span>{upcoming[0] ? `Familia ${upcoming[0].contact}` : 'Tu agenda está libre'}</span>
        </article>
        <Kpi
          icon="calendar"
          label="Próximos 7 días"
          value={kpi.next7Days}
          unit={kpi.next7Days === 1 ? 'visita' : 'visitas'}
        />
        <Kpi
          icon="check"
          label="Confirmadas"
          value={kpi.confirmedPercent === null ? '—' : `${kpi.confirmedPercent} %`}
          unit={pending === 1 ? '1 por confirmar' : `${pending} por confirmar`}
          meter={kpi.confirmedPercent ?? 0}
        />
        <Kpi
          icon="bell"
          label="Avisos abiertos"
          value={kpi.openAlerts}
          unit={kpi.openAlerts === 0 ? 'todo al día' : 'requieren respuesta'}
          tone={kpi.openAlerts > 0 ? 'warn' : 'ok'}
        />
      </div>
      {error && (
        <p role="alert" className="banner error">
          {error}
        </p>
      )}
      {open.length > 0 && (
        <div className="alerts card" id="alerts" aria-label="Avisos">
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
                <span className="alert-copy">
                  <strong>{ALERT_ES[a.reason] ?? a.reason}</strong>
                  <span>
                    Familia {a.contact} · {formatStampEs(a.at)}
                  </span>
                </span>
                <button
                  type="button"
                  className="ghost"
                  disabled={resolving !== null}
                  onClick={() => resolve(a.id)}
                >
                  <Icon name="check" />
                  {resolving === a.id ? 'Marcando…' : 'Resuelto'}
                </button>
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
                <Directions
                  contact={a.contact}
                  address={book[a.contact] ?? ''}
                  onSave={(address) => setBook((b) => saveAddress(b, a.contact, address))}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
