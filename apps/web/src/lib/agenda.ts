// agenda.ts: reads the scheduling plane (time and status only) from the API. Degraded, never thrown.
import { guard, type PortResult } from '@audiorapy/domain';

export interface AgendaAppointment {
  id: string;
  contact: string;
  startsAt: string;
  label: string;
  status: string;
}

export interface AgendaAlert {
  id: string;
  contact: string;
  reason: string;
  at: string;
  resolved: boolean;
}

export interface Agenda {
  generatedAt: string;
  appointments: AgendaAppointment[];
  alerts: AgendaAlert[];
}

export interface ApiSettings {
  baseUrl: string;
  token: string;
}

export async function fetchAgenda(
  settings: ApiSettings,
  fetchImpl: typeof fetch = fetch,
): Promise<PortResult<Agenda>> {
  if (!settings.baseUrl || !settings.token) {
    return {
      available: false,
      source: 'api',
      checked_at: new Date().toISOString(),
      data: null,
      error: 'API no configurada',
    };
  }
  return guard(
    'api',
    async (signal) => {
      const res = await fetchImpl(`${settings.baseUrl.replace(/\/$/, '')}/api/agenda`, {
        headers: { Authorization: `Bearer ${settings.token}` },
        signal,
      });
      if (res.status === 401) throw new Error('token rechazado');
      if (!res.ok) throw new Error(`la API respondió ${res.status}`);
      return (await res.json()) as Agenda;
    },
    5000,
  );
}

/** Marks an alert handled on the server. Degraded, never thrown. */
export async function resolveAlert(
  settings: ApiSettings,
  id: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PortResult<true>> {
  return guard(
    'api',
    async (signal) => {
      const res = await fetchImpl(
        `${settings.baseUrl.replace(/\/$/, '')}/api/alerts/${encodeURIComponent(id)}/resolve`,
        { method: 'POST', headers: { Authorization: `Bearer ${settings.token}` }, signal },
      );
      if (res.status === 401) throw new Error('token rechazado');
      if (!res.ok) throw new Error(`la API respondió ${res.status}`);
      return true as const;
    },
    5000,
  );
}

export interface AgendaKpis {
  upcoming: number;
  next7Days: number;
  confirmed: number;
  /** Confirmed share of upcoming visits, 0..100, or null with no upcoming visits. */
  confirmedPercent: number | null;
  openAlerts: number;
}

const ACTIVE = new Set(['scheduled', 'confirmed']);

export function agendaKpis(agenda: Agenda, now: Date): AgendaKpis {
  const nowMs = now.getTime();
  const upcoming = agenda.appointments.filter(
    (a) => ACTIVE.has(a.status) && !(Date.parse(a.startsAt) < nowMs),
  );
  const weekEnd = nowMs + 7 * 86_400_000;
  const confirmed = upcoming.filter((a) => a.status === 'confirmed').length;
  return {
    upcoming: upcoming.length,
    next7Days: upcoming.filter((a) => Date.parse(a.startsAt) <= weekEnd).length,
    confirmed,
    confirmedPercent: upcoming.length ? Math.round((confirmed / upcoming.length) * 100) : null,
    openAlerts: agenda.alerts.filter((a) => !a.resolved).length,
  };
}

export const STATUS_ES: Record<string, string> = {
  scheduled: 'Pendiente de confirmar',
  confirmed: 'Confirmada',
  attended: 'Atendida',
  late_cancel: 'Cancelada tarde',
  no_show: 'No asistió',
  cancelled_by_caregiver: 'Cancelada por la familia',
  cancelled_by_therapist: 'Cancelada por ti',
};

export const ALERT_ES: Record<string, string> = {
  no_reply: 'Sin respuesta al recordatorio',
  question: 'Pregunta de la familia',
  unknown: 'Mensaje sin entender',
  no_slots: 'Sin cupos disponibles',
  other_slot: 'Pide otro horario',
  reschedule_requested: 'Pide reprogramar',
  cancelled: 'Canceló la visita',
};
