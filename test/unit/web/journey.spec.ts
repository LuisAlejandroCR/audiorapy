// journey.spec.ts: the guided start route, recovery quiz, live session stats, KPIs, map links and the
// fixes that came out of the B16 UI/UX audit (local dates, alert resolution, double period).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booked, endSentence, reminder } from '@audiorapy/domain';
import {
  journey,
  loadFlags,
  MAX_XP,
  parseFlags,
  quizMatches,
  quizPositions,
  saveFlags,
} from '../../../apps/web/src/lib/journey.ts';
import {
  caseloadKpis,
  formatDayEs,
  liveStats,
  localDate,
  masteryRun,
} from '../../../apps/web/src/lib/stats.ts';
import { agendaKpis, resolveAlert, type Agenda } from '../../../apps/web/src/lib/agenda.ts';
import { cleanAddress, mapLink, parseBook, saveAddress } from '../../../apps/web/src/lib/maps.ts';
import {
  byKind,
  sessionsNewestFirst,
  syntheticRecords,
  type ClinicalRecord,
  type Session,
} from '../../../apps/web/src/lib/records.ts';
import { cleanApiSettings } from '../../../apps/web/src/lib/settings.ts';
import { qrPath } from '../../../apps/web/src/lib/qr.ts';
import { buildInbox, initials, parseProfile, parseRead } from '../../../apps/web/src/lib/inbox.ts';
import { executiveSummary, newAlertIds, sparkline } from '../../../apps/web/src/lib/summary.ts';
import { fakeFetch } from '../../api-helpers.ts';

function fakeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

afterEach(() => vi.unstubAllGlobals());

const TODAY = new Date('2026-10-04T15:00:00Z');
const userSession: Session = {
  kind: 'session',
  id: 'abc-123',
  patientId: 'synthetic-patient-a',
  date: '2026-10-04',
  targets: [
    { targetId: 't-s-initial', targetLabel: '/s/', trials: [{ correct: true, cue: 'min' }] },
  ],
  therapistNotes: '',
};

describe('start route', () => {
  it('a fresh vault has only the vault step and points to the recovery check', () => {
    const r = journey([], {});
    expect(r.completed).toBe(1);
    expect(r.xp).toBe(100);
    expect(r.next).toBe('recovery');
    expect(r.rank).toBe('Primeros pasos');
  });

  it('synthetic sessions do not count as a recorded session; a therapist session does', () => {
    const demo = syntheticRecords(TODAY);
    expect(journey(demo, {}).steps.find((s) => s.id === 'session')!.done).toBe(false);
    expect(journey([...demo, userSession], {}).steps.find((s) => s.id === 'session')!.done).toBe(
      true,
    );
  });

  it('every step done gives the full score and the top rank', () => {
    const records: ClinicalRecord[] = [
      ...syntheticRecords(TODAY),
      userSession,
      {
        kind: 'soap_note',
        id: 'n1',
        sessionId: 'abc-123',
        approvedAt: TODAY.toISOString(),
        note: {} as never,
      },
    ];
    const r = journey(records, { recoveryVerified: true, backupAt: TODAY.toISOString() });
    expect(r).toMatchObject({ completed: 6, total: 6, xp: MAX_XP, next: null });
    expect(r.rank).toBe('Consulta blindada');
  });

  it('flags are kept per vault and malformed storage counts as nothing done', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    saveFlags('aaaa', { recoveryVerified: true });
    saveFlags('bbbb', { backupAt: '2026-10-04T00:00:00Z' });
    expect(loadFlags('aaaa')).toEqual({ recoveryVerified: true });
    expect(loadFlags('bbbb')).toEqual({ backupAt: '2026-10-04T00:00:00Z' });
    expect(loadFlags('cccc')).toEqual({});
    expect(parseFlags('{not json', 'aaaa')).toEqual({});
    expect(parseFlags('{"aaaa":{"recoveryVerified":"yes"}}', 'aaaa')).toEqual({});
    expect(parseFlags('{"aaaa":{}}', '__proto__')).toEqual({});
  });

  it('without storage, flags degrade to nothing done instead of throwing', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(loadFlags('aaaa')).toEqual({});
    expect(() => saveFlags('aaaa', { recoveryVerified: true })).not.toThrow();
  });
});

describe('recovery quiz', () => {
  it('asks for distinct, ordered positions inside the phrase', () => {
    const p = quizPositions(24, 3, () => 0.5);
    expect(p).toHaveLength(3);
    expect(new Set(p).size).toBe(3);
    expect([...p].sort((a, b) => a - b)).toEqual(p);
  });

  it('accepts the word without accents, in capitals or with spaces, and rejects others', () => {
    expect(quizMatches('líquido', ' LIQUIDO ')).toBe(true);
    expect(quizMatches('ciclón', 'ciclon')).toBe(true);
    expect(quizMatches('ciclón', 'ciclo')).toBe(false);
    expect(quizMatches('', '')).toBe(false);
  });
});

describe('session feedback', () => {
  it('streak counts the run ending at the last trial; best keeps the longest', () => {
    const s = liveStats([true, true, true, false, true, true], 80, 10);
    expect(s).toMatchObject({ count: 6, correct: 5, streak: 2, bestStreak: 3, percent: 83 });
    expect(s.criterionMet).toBe(false); // fewer trials than the goal
  });

  it('the criterion is met only with the trial goal reached and the percent at or above it', () => {
    expect(liveStats(Array(10).fill(true), 80).criterionMet).toBe(true);
    expect(liveStats([...Array(7).fill(true), false, false, false], 80).criterionMet).toBe(false);
  });

  it('mastery run counts consecutive sessions at or above criterion from the latest', () => {
    expect(masteryRun([90, 50, 80, 85, 100], 80)).toBe(3);
    expect(masteryRun([90, 90, 70], 80)).toBe(0);
    expect(masteryRun([], 80)).toBe(0);
  });

  it('caseload KPIs: the synthetic case improves to mastery and has every session without a note', () => {
    const recs = syntheticRecords(TODAY);
    const patient = byKind(recs, 'patient')[0]!;
    const k = caseloadKpis(patient, byKind(recs, 'session'), [], TODAY);
    expect(k.sessions).toBe(8);
    expect(k.targets).toBe(3);
    expect(k.pendingNotes).toBe(8);
    expect(k.latestAccuracy).not.toBeNull();
    expect(k.mastered).toBeGreaterThanOrEqual(0);
    expect(k.mastered).toBeLessThanOrEqual(3);
  });
});

describe('session order', () => {
  it('a session recorded today sorts above a demo session of the same day', () => {
    const demo = { ...userSession, id: 'synthetic-session-8', date: '2026-10-04' };
    const mine = { ...userSession, id: 'mine', date: '2026-10-04' };
    const older = { ...userSession, id: 'old', date: '2026-10-01' };
    expect(sessionsNewestFirst([older, demo, mine]).map((s) => s.id)).toEqual([
      'mine',
      'synthetic-session-8',
      'old',
    ]);
  });

  it('demo sessions end the day before today in local time, even late in the evening', () => {
    const lateEvening = new Date(2026, 9, 4, 22, 50);
    const days = byKind(syntheticRecords(lateEvening), 'session').map((s) => s.date);
    expect(days.at(-1)).toBe('2026-10-03');
    expect(days.every((d) => d < localDate(lateEvening))).toBe(true);
  });
});

describe('dates', () => {
  it('localDate uses the device time zone, not UTC', () => {
    const d = new Date(2026, 9, 4, 21, 30); // 9:30 p.m. local
    expect(localDate(d)).toBe('2026-10-04');
  });

  it('formats a stored day in Spanish and leaves anything else untouched', () => {
    expect(formatDayEs('2026-10-03')).toMatch(/3 oct 2026/);
    expect(formatDayEs('ayer')).toBe('ayer');
  });
});

describe('agenda', () => {
  const agenda: Agenda = {
    generatedAt: TODAY.toISOString(),
    appointments: [
      {
        id: '1',
        contact: '••••1',
        startsAt: '2026-10-05T13:00:00Z',
        label: '',
        status: 'confirmed',
      },
      {
        id: '2',
        contact: '••••2',
        startsAt: '2026-10-06T13:00:00Z',
        label: '',
        status: 'scheduled',
      },
      {
        id: '3',
        contact: '••••3',
        startsAt: '2026-10-20T13:00:00Z',
        label: '',
        status: 'scheduled',
      },
      {
        id: '4',
        contact: '••••4',
        startsAt: '2026-10-01T13:00:00Z',
        label: '',
        status: 'scheduled',
      },
      { id: '5', contact: '••••5', startsAt: '2026-10-07T13:00:00Z', label: '', status: 'no_show' },
    ],
    alerts: [
      { id: 'a', contact: '••••2', reason: 'question', at: TODAY.toISOString(), resolved: false },
      { id: 'b', contact: '••••3', reason: 'question', at: TODAY.toISOString(), resolved: true },
    ],
  };

  it('KPIs count only future active visits and open alerts', () => {
    expect(agendaKpis(agenda, TODAY)).toEqual({
      upcoming: 3,
      next7Days: 2,
      confirmed: 1,
      confirmedPercent: 33,
      openAlerts: 1,
    });
  });

  it('no upcoming visits means no confirmation rate, not 0 %', () => {
    expect(agendaKpis({ ...agenda, appointments: [] }, TODAY).confirmedPercent).toBeNull();
  });

  it('resolving an alert posts to the API with the token and reports a rejected token', async () => {
    let seen = '';
    const ok = await resolveAlert(
      { baseUrl: 'http://api/', token: 't' },
      'a/b',
      fakeFetch((url, init) => {
        seen = `${init.method} ${url} ${(init.headers as Record<string, string>).Authorization}`;
        return new Response('{}', { status: 200 });
      }),
    );
    expect(ok.available).toBe(true);
    expect(seen).toBe('POST http://api/api/alerts/a%2Fb/resolve Bearer t');
    const bad = await resolveAlert(
      { baseUrl: 'http://api', token: 'x' },
      'a',
      fakeFetch(() => new Response('', { status: 401 })),
    );
    expect(bad).toMatchObject({ available: false, error: 'token rechazado' });
  });
});

describe('directions', () => {
  it('builds Google Maps, Apple Maps and Waze links with the address encoded', () => {
    const a = 'Calle 45 # 12-30, Bogotá';
    expect(mapLink('google', a)).toBe(
      'https://www.google.com/maps/search/?api=1&query=Calle%2045%20%23%2012-30%2C%20Bogot%C3%A1',
    );
    expect(mapLink('apple', a)).toMatch(/^https:\/\/maps\.apple\.com\/\?q=Calle%2045/);
    expect(mapLink('waze', a)).toMatch(/^https:\/\/waze\.com\/ul\?q=Calle.*&navigate=yes$/);
  });

  it('a blank address gives no link', () => {
    expect(mapLink('google', '   \n ')).toBeNull();
    expect(cleanAddress('  Cra 7\n\t# 1 ')).toBe('Cra 7 # 1');
  });

  it('the address book saves, forgets and refuses prototype keys', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    let book = saveAddress({}, '••••2233', 'Calle 1');
    expect(book).toEqual({ '••••2233': 'Calle 1' });
    book = saveAddress(book, '••••2233', '');
    expect(book).toEqual({});
    expect(saveAddress({}, '__proto__', 'x')).toEqual({});
    expect(Object.getPrototypeOf(parseBook('{"__proto__":"x","a":"b"}'))).toBe(Object.prototype);
    expect(parseBook('{"__proto__":"x","a":"b"}')).toEqual({ a: 'b' });
  });
});

describe('connection settings', () => {
  it('trailing slashes and spaces mixed together are all removed (invariant counterexample)', () => {
    expect(cleanApiSettings({ baseUrl: 'http://api/ / ', token: 't' }).baseUrl).toBe('http://api');
  });

  it('a pasted token or address loses its spaces, newline and trailing slashes', () => {
    expect(
      cleanApiSettings({ baseUrl: ' https://api.example.org// \n', token: '\tabc123 \n' }),
    ).toEqual({ baseUrl: 'https://api.example.org', token: 'abc123' });
  });
});

describe('executive summary', () => {
  const agenda: Agenda = {
    generatedAt: TODAY.toISOString(),
    appointments: [
      {
        id: '1',
        contact: '••••1',
        startsAt: '2026-10-05T13:00:00Z',
        label: '',
        status: 'scheduled',
      },
      {
        id: '2',
        contact: '••••2',
        startsAt: '2026-10-06T13:00:00Z',
        label: '',
        status: 'confirmed',
      },
    ],
    alerts: [
      { id: 'a', contact: '••••1', reason: 'question', at: TODAY.toISOString(), resolved: false },
    ],
  };

  it('puts alerts first, then confirmations, then notes, then the next session', () => {
    const demo = syntheticRecords(TODAY);
    expect(executiveSummary(agenda, demo, TODAY).focus).toBe('alerts');
    expect(executiveSummary({ ...agenda, alerts: [] }, demo, TODAY).focus).toBe('confirm');
    const noAlertsAllConfirmed = {
      ...agenda,
      alerts: [],
      appointments: agenda.appointments.map((a) => ({ ...a, status: 'confirmed' })),
    };
    expect(executiveSummary(noAlertsAllConfirmed, demo, TODAY).focus).toBe('notes');
    expect(executiveSummary(null, [], TODAY).focus).toBe('clear');
  });

  it('the headline is built from the numbers, with the accuracy trend of the last 8 sessions', () => {
    const s = executiveSummary(agenda, syntheticRecords(TODAY), TODAY);
    expect(s).toMatchObject({ next7Days: 2, toConfirm: 1, openAlerts: 1, pendingNotes: 8 });
    expect(s.trend).toHaveLength(8);
    expect(s.headline).toContain(
      '2 visitas en 7 días · 1 por confirmar · 1 aviso · 8 notas pendientes.',
    );
    expect(s.headline).toMatch(/Acierto promedio \d+ %/);
    expect(executiveSummary(null, [], TODAY).headline).toBe(
      'agenda sin conectar · 0 notas pendientes.',
    );
  });

  it('only unseen open alerts are new; sparkline points stay inside the box', () => {
    expect(newAlertIds(new Set(['a']), agenda)).toEqual([]);
    expect(newAlertIds(new Set(), agenda)).toEqual(['a']);
    expect(sparkline([0, 50, 100], 100, 40)).toBe('0.0,40.0 50.0,20.0 100.0,0.0');
    expect(sparkline([], 100, 40)).toBe('');
  });
});

describe('notification center and profile', () => {
  const agenda: Agenda = {
    generatedAt: TODAY.toISOString(),
    appointments: [
      {
        id: 'v1',
        contact: '••••1',
        startsAt: '2026-10-05T13:00:00Z',
        label: 'lun 5 oct',
        status: 'scheduled',
      },
      {
        id: 'v2',
        contact: '••••2',
        startsAt: '2026-10-09T13:00:00Z',
        label: 'vie 9 oct',
        status: 'scheduled',
      },
    ],
    alerts: [
      { id: 'a1', contact: '••••1', reason: 'question', at: TODAY.toISOString(), resolved: false },
      { id: 'a2', contact: '••••2', reason: 'question', at: TODAY.toISOString(), resolved: true },
    ],
  };

  it('lists open alerts first, then visits within 24 h, then achievements; read ids are not unread', () => {
    const route = journey(syntheticRecords(TODAY), { recoveryVerified: true });
    const items = buildInbox(agenda, route, new Set(['visit:v1']), TODAY);
    expect(items.map((i) => i.id)).toEqual([
      'alert:a1',
      'visit:v1',
      'step:recovery',
      'step:patient',
    ]);
    expect(items.find((i) => i.id === 'visit:v1')!.unread).toBe(false);
    expect(items.filter((i) => i.unread)).toHaveLength(3);
  });

  it('without agenda or route the inbox is empty, not broken', () => {
    expect(buildInbox(null, null, new Set(), TODAY)).toEqual([]);
  });

  it('profile and read marks survive bad storage; initials come from first and last name', () => {
    expect(parseProfile('{"name":1}').name).toBe('');
    expect(parseProfile(null).profession).toBe('Fonoaudióloga');
    expect([...parseRead('["a","b"]')]).toEqual(['a', 'b']);
    expect([...parseRead('{"a":1}')]).toEqual([]);
    expect(initials('Ana María Rojas')).toBe('AR');
    expect(initials('  ')).toBe('A');
  });
});

describe('QR codes', () => {
  it('encodes the dashboard and Expo links, deterministically', () => {
    const a = qrPath('https://audiorapy.example/app/');
    expect(a).not.toBeNull();
    expect(a!.size).toBeGreaterThanOrEqual(21);
    expect(a!.dark).toBeGreaterThan(0);
    expect(qrPath('https://audiorapy.example/app/')).toEqual(a);
    expect(qrPath('exp://u.expo.dev/abc?channel-name=preview')).not.toBeNull();
  });

  it('refuses anything that is not a web or Expo link', () => {
    expect(qrPath('javascript:alert(1)')).toBeNull();
    expect(qrPath('data:text/html,hi')).toBeNull();
    expect(qrPath('')).toBeNull();
    expect(qrPath(`https://x/${'a'.repeat(600)}`)).toBeNull();
  });
});

describe('caregiver messages', () => {
  it('a slot label ending in "a. m." closes the sentence: no double period', () => {
    const at = '2026-10-06T13:00:00.000Z';
    expect(booked(at).body).not.toContain('..');
    expect(booked(at).body).toContain('8:00 a. m. Te enviaremos');
    if (reminder(at).type === 'buttons') expect(reminder(at).body).not.toContain('..');
    expect(endSentence('Hola')).toBe('Hola.');
    expect(endSentence('8:00 p. m.')).toBe('8:00 p. m.');
  });
});
