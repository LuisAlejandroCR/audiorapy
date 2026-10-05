// agenda.ts: the visits the app shows — from the scheduling API when a URL and token are set (same
// endpoint and masking as the web dashboard), otherwise a synthetic demo agenda labeled as such.
import { fetchAgenda, type Agenda, type ApiSettings } from '@audiorapy/web-lib/agenda.ts';
import { formatSlotEs } from '@audiorapy/domain';

export interface Loaded {
  agenda: Agenda;
  source: 'api' | 'demo';
  error: string | null;
}

/** Two synthetic families, tomorrow and the day after at 8:00 and 10:30 a. m. Bogotá. */
export function demoAgenda(now: Date): Agenda {
  const at = (days: number, hourUtc: number) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days, hourUtc));
  const visits = [
    { id: 'demo-1', contact: '••••2233', startsAt: at(1, 13), status: 'confirmed' },
    { id: 'demo-2', contact: '••••6677', startsAt: at(2, 15), status: 'scheduled' },
  ];
  return {
    generatedAt: now.toISOString(),
    appointments: visits.map((v) => ({
      ...v,
      startsAt: v.startsAt.toISOString(),
      label: formatSlotEs(v.startsAt),
    })),
    alerts: [
      {
        id: 'demo-a',
        contact: '••••6677',
        reason: 'question',
        at: now.toISOString(),
        resolved: false,
      },
    ],
  };
}

export async function loadAgenda(settings: ApiSettings, now: Date): Promise<Loaded> {
  if (!settings.baseUrl || !settings.token)
    return { agenda: demoAgenda(now), source: 'demo', error: null };
  const r = await fetchAgenda(settings);
  return r.available
    ? { agenda: r.data, source: 'api', error: null }
    : { agenda: demoAgenda(now), source: 'demo', error: r.error };
}
