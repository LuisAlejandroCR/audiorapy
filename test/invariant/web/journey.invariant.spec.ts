// journey.invariant.spec.ts: promises behind the guided route and the session feedback, for every
// input — steps are earned only by real records, points never go down, the quiz always asks distinct
// words that exist, stats agree with the trials, map links round-trip the address, and no message to a
// caregiver ever carries a double period.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { booked, cancelCheck, reminder } from '@audiorapy/domain';
import {
  journey,
  JOURNEY_STEPS,
  MAX_XP,
  quizMatches,
  quizPositions,
  type JourneyFlags,
} from '../../../apps/web/src/lib/journey.ts';
import { liveStats, localDate, masteryRun } from '../../../apps/web/src/lib/stats.ts';
import { agendaKpis, type Agenda } from '../../../apps/web/src/lib/agenda.ts';
import { cleanAddress, MAP_APPS, mapLink } from '../../../apps/web/src/lib/maps.ts';
import {
  sessionsNewestFirst,
  type ClinicalRecord,
  type Session,
} from '../../../apps/web/src/lib/records.ts';
import { cleanApiSettings } from '../../../apps/web/src/lib/settings.ts';
import { qrPath, QUIET } from '../../../apps/web/src/lib/qr.ts';
import { executiveSummary, newAlertIds } from '../../../apps/web/src/lib/summary.ts';
import { buildInbox } from '../../../apps/web/src/lib/inbox.ts';
import { iso } from '../../arbitraries.ts';

const recordArb: fc.Arbitrary<ClinicalRecord> = fc.oneof(
  fc.record({
    kind: fc.constant('patient' as const),
    id: fc.string(),
    alias: fc.string(),
    synthetic: fc.boolean(),
    targets: fc.constant([] as never[]),
  }),
  fc.record({
    kind: fc.constant('session' as const),
    id: fc.oneof(
      fc.string(),
      fc.string().map((s) => `synthetic-${s}`),
    ),
    patientId: fc.string(),
    date: fc.constant('2026-10-04'),
    targets: fc.constant([] as never[]),
    therapistNotes: fc.constant(''),
  }),
  fc.record({
    kind: fc.constant('soap_note' as const),
    id: fc.string(),
    sessionId: fc.string(),
    approvedAt: fc.constant('2026-10-04T00:00:00Z'),
    note: fc.constant({} as never),
  }),
);

const flagsArb: fc.Arbitrary<JourneyFlags> = fc.record(
  { recoveryVerified: fc.boolean(), backupAt: fc.string({ maxLength: 30 }) },
  { requiredKeys: [] },
);

describe('start route (invariant)', () => {
  it('points, count and next step always agree with the steps marked done', () => {
    fc.assert(
      fc.property(fc.array(recordArb, { maxLength: 20 }), flagsArb, (records, flags) => {
        const r = journey(records, flags);
        const done = r.steps.filter((s) => s.done);
        expect(r.completed).toBe(done.length);
        expect(r.xp).toBe(done.reduce((sum, s) => sum + s.xp, 0));
        expect(r.xp).toBeGreaterThanOrEqual(0);
        expect(r.xp).toBeLessThanOrEqual(MAX_XP);
        expect(r.next).toBe(r.steps.find((s) => !s.done)?.id ?? null);
        expect(r.steps.map((s) => s.id)).toEqual(JOURNEY_STEPS.map((s) => s.id));
      }),
      { numRuns: 1000 },
    );
  });

  it('adding records or flags never takes points away (progress is monotone)', () => {
    fc.assert(
      fc.property(
        fc.array(recordArb, { maxLength: 10 }),
        fc.array(recordArb, { maxLength: 10 }),
        flagsArb,
        (a, b, flags) => {
          const before = journey(a, {});
          const after = journey([...a, ...b], flags);
          expect(after.xp).toBeGreaterThanOrEqual(before.xp);
          for (const s of before.steps)
            if (s.done) expect(after.steps.find((x) => x.id === s.id)!.done).toBe(true);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('only synthetic records can never complete the "record a session" step', () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { maxLength: 10 }), (ids) => {
        const records: ClinicalRecord[] = ids.map((id) => ({
          kind: 'session',
          id: `synthetic-${id}`,
          patientId: 'p',
          date: '2026-10-04',
          targets: [],
          therapistNotes: '',
        }));
        expect(journey(records, {}).steps.find((s) => s.id === 'session')!.done).toBe(false);
      }),
    );
  });
});

describe('recovery quiz (invariant)', () => {
  it('positions are distinct, sorted, inside the phrase and as many as asked (when possible)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 48 }),
        fc.integer({ min: 0, max: 10 }),
        fc.array(fc.double({ min: 0, max: 1, noNaN: true }), { minLength: 1 }),
        (len, k, rolls) => {
          let i = 0;
          const p = quizPositions(len, k, () => rolls[i++ % rolls.length]!);
          expect(p).toHaveLength(Math.min(len, k));
          expect(new Set(p).size).toBe(p.length);
          for (const x of p) expect(x >= 0 && x < len).toBe(true);
          expect([...p].sort((a, b) => a - b)).toEqual(p);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('a word always matches itself however it is cased or accented, and never a different word', () => {
    const word = fc.stringMatching(/^[a-zñáéíóúü]{1,12}$/);
    fc.assert(
      fc.property(word, word, (w, other) => {
        const plain = w.normalize('NFD').replace(/\p{M}+/gu, '');
        expect(quizMatches(w, ` ${plain.toUpperCase()} `)).toBe(true);
        const otherPlain = other.normalize('NFD').replace(/\p{M}+/gu, '');
        if (otherPlain !== plain) expect(quizMatches(w, other)).toBe(false);
      }),
      { numRuns: 1000 },
    );
  });
});

describe('session feedback (invariant)', () => {
  it('stats agree with the trials: correct, streaks and percent', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { maxLength: 100 }), (outcomes) => {
        const s = liveStats(outcomes, 80);
        expect(s.count).toBe(outcomes.length);
        expect(s.correct).toBe(outcomes.filter(Boolean).length);
        expect(s.streak).toBeLessThanOrEqual(s.bestStreak);
        expect(s.bestStreak).toBeLessThanOrEqual(s.correct);
        const tail = outcomes.length - 1 - outcomes.lastIndexOf(false);
        expect(s.streak).toBe(outcomes.includes(false) ? tail : outcomes.length);
        if (s.criterionMet) expect(s.percent).toBeGreaterThanOrEqual(80);
      }),
      { numRuns: 1000 },
    );
  });

  it('a mastery run is never longer than the series and is 0 when the last session is below', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), { maxLength: 30 }),
        fc.integer({ min: 0, max: 100 }),
        (percents, criterion) => {
          const run = masteryRun(percents, criterion);
          expect(run).toBeLessThanOrEqual(percents.length);
          if (percents.length && percents.at(-1)! < criterion) expect(run).toBe(0);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('localDate always names the same calendar day the device shows', () => {
    fc.assert(
      fc.property(
        fc.date({ noInvalidDate: true, min: new Date('2000-01-01'), max: new Date('2099-12-31') }),
        (d) => {
          const [y, m, day] = localDate(d).split('-').map(Number);
          expect([y, m, day]).toEqual([d.getFullYear(), d.getMonth() + 1, d.getDate()]);
        },
      ),
      { numRuns: 1000 },
    );
  });
});

describe('agenda and directions (invariant)', () => {
  const status = fc.constantFrom('scheduled', 'confirmed', 'attended', 'no_show', 'late_cancel');
  const agendaArb: fc.Arbitrary<Agenda> = fc.record({
    generatedAt: iso,
    appointments: fc.array(
      fc.record({ id: fc.uuid(), contact: fc.string(), startsAt: iso, label: fc.string(), status }),
      { maxLength: 20 },
    ),
    alerts: fc.array(
      fc.record({
        id: fc.uuid(),
        contact: fc.string(),
        reason: fc.string(),
        at: iso,
        resolved: fc.boolean(),
      }),
      { maxLength: 10 },
    ),
  });

  it('KPIs are consistent: confirmed ≤ upcoming, 7-day ≤ upcoming, rate in 0..100', () => {
    fc.assert(
      fc.property(agendaArb, iso, (agenda, now) => {
        const k = agendaKpis(agenda, new Date(now));
        expect(k.confirmed).toBeLessThanOrEqual(k.upcoming);
        expect(k.next7Days).toBeLessThanOrEqual(k.upcoming);
        expect(k.openAlerts).toBe(agenda.alerts.filter((a) => !a.resolved).length);
        if (k.upcoming === 0) expect(k.confirmedPercent).toBeNull();
        else expect(k.confirmedPercent! >= 0 && k.confirmedPercent! <= 100).toBe(true);
      }),
      { numRuns: 1000 },
    );
  });

  it('every map link carries exactly the cleaned address back out of its query', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 120 }), (addr) => {
        const clean = cleanAddress(addr);
        for (const app of MAP_APPS) {
          const link = mapLink(app.id, addr);
          if (!clean) expect(link).toBeNull();
          else {
            const u = new URL(link!);
            expect(u.searchParams.get(app.id === 'google' ? 'query' : 'q')).toBe(clean);
          }
        }
      }),
      { numRuns: 1000 },
    );
  });
});

describe('session order (invariant)', () => {
  it('newest day first, and within a day the most recently recorded first; nothing lost', () => {
    const day = fc.constantFrom('2026-10-01', '2026-10-02', '2026-10-03');
    fc.assert(
      fc.property(fc.array(day, { maxLength: 30 }), (days) => {
        const sessions: Session[] = days.map((date, i) => ({
          kind: 'session',
          id: `s${i}`,
          patientId: 'p',
          date,
          targets: [],
          therapistNotes: '',
        }));
        const out = sessionsNewestFirst(sessions);
        expect(out.map((s) => s.id).sort()).toEqual(sessions.map((s) => s.id).sort());
        for (let k = 1; k < out.length; k++) {
          const a = out[k - 1]!;
          const b = out[k]!;
          expect(a.date >= b.date).toBe(true);
          if (a.date === b.date)
            expect(Number(a.id.slice(1))).toBeGreaterThan(Number(b.id.slice(1)));
        }
      }),
      { numRuns: 1000 },
    );
  });
});

describe('connection settings (invariant)', () => {
  it('cleaning is idempotent, never leaves outer whitespace, and keeps the inner token intact', () => {
    const ws = fc.constantFrom(' ', '\n', '\t', '\r\n', '');
    const core = fc.stringMatching(/^[A-Za-z0-9._~-]{1,40}$/);
    fc.assert(
      fc.property(ws, core, ws, fc.string(), (pre, token, post, url) => {
        const once = cleanApiSettings({ baseUrl: url, token: `${pre}${token}${post}` });
        expect(once.token).toBe(token);
        expect(cleanApiSettings(once)).toEqual(once);
        expect(once.baseUrl).toBe(once.baseUrl.trim());
        expect(once.baseUrl.endsWith('/')).toBe(false);
      }),
      { numRuns: 1000 },
    );
  });
});

describe('executive summary (invariant)', () => {
  const status = fc.constantFrom('scheduled', 'confirmed', 'attended', 'no_show');
  const agendaArb: fc.Arbitrary<Agenda> = fc.record({
    generatedAt: iso,
    appointments: fc.array(
      fc.record({ id: fc.uuid(), contact: fc.string(), startsAt: iso, label: fc.string(), status }),
      { maxLength: 15 },
    ),
    alerts: fc.array(
      fc.record({
        id: fc.uuid(),
        contact: fc.string(),
        reason: fc.string(),
        at: iso,
        resolved: fc.boolean(),
      }),
      { maxLength: 8 },
    ),
  });

  it('agrees with the agenda KPIs and never points past an urgent item', () => {
    fc.assert(
      fc.property(agendaArb, iso, (agenda, now) => {
        const s = executiveSummary(agenda, [], new Date(now));
        const k = agendaKpis(agenda, new Date(now));
        expect(s.openAlerts).toBe(k.openAlerts);
        expect(s.toConfirm).toBe(k.upcoming - k.confirmed);
        if (s.openAlerts > 0) expect(s.focus).toBe('alerts');
        else if (s.toConfirm > 0) expect(s.focus).toBe('confirm');
        expect(s.headline.endsWith('.')).toBe(true);
      }),
      { numRuns: 500 },
    );
  });

  it('an alert is "new" exactly once: after it is seen it never comes back', () => {
    fc.assert(
      fc.property(agendaArb, (agenda) => {
        const first = newAlertIds(new Set(), agenda);
        expect(newAlertIds(new Set(first), agenda)).toEqual([]);
        for (const id of first)
          expect(agenda.alerts.find((a) => a.id === id)?.resolved).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});

describe('notification center (invariant)', () => {
  const status = fc.constantFrom('scheduled', 'confirmed', 'attended', 'no_show');
  const agendaArb: fc.Arbitrary<Agenda> = fc.record({
    generatedAt: iso,
    appointments: fc.array(
      fc.record({ id: fc.uuid(), contact: fc.string(), startsAt: iso, label: fc.string(), status }),
      { maxLength: 12 },
    ),
    alerts: fc.array(
      fc.record({
        id: fc.uuid(),
        contact: fc.string(),
        reason: fc.string(),
        at: iso,
        resolved: fc.boolean(),
      }),
      { maxLength: 8 },
    ),
  });

  it('alerts always come before visits and achievements; every open alert appears once; reading all clears the count', () => {
    fc.assert(
      fc.property(agendaArb, iso, flagsArb, (agenda, now, flags) => {
        const route = journey([], flags);
        const items = buildInbox(agenda, route, new Set(), new Date(now));
        const kinds = items.map((i) => i.kind);
        const order = { alert: 0, visit: 1, achievement: 2 };
        for (let k = 1; k < kinds.length; k++)
          expect(order[kinds[k - 1]!] <= order[kinds[k]!]).toBe(true);
        expect(items.filter((i) => i.kind === 'alert')).toHaveLength(
          agenda.alerts.filter((a) => !a.resolved).length,
        );
        expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
        const all = new Set(items.map((i) => i.id));
        expect(buildInbox(agenda, route, all, new Date(now)).some((i) => i.unread)).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});

describe('QR codes (invariant)', () => {
  it('every web URL becomes a square symbol whose squares all lie inside it, one per dark module', () => {
    fc.assert(
      fc.property(fc.webUrl({ withQueryParameters: true }), (url) => {
        const q = qrPath(url);
        if (url.length > 512) return;
        expect(q).not.toBeNull();
        expect((q!.size - 17) % 4).toBe(0); // QR versions are 21, 25, … 177 modules per side
        const squares = [...q!.d.matchAll(/M(\d+) (\d+)/g)].map((m) => [
          Number(m[1]),
          Number(m[2]),
        ]);
        expect(squares).toHaveLength(q!.dark);
        for (const [x, y] of squares) {
          expect(x! >= QUIET && x! < QUIET + q!.size).toBe(true);
          expect(y! >= QUIET && y! < QUIET + q!.size).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });
});

describe('caregiver messages (invariant)', () => {
  it('no slot-bearing message has a double period, for any visit time', () => {
    fc.assert(
      fc.property(iso, (at) => {
        for (const m of [booked(at), reminder(at), cancelCheck(at)])
          if ('body' in m) expect(m.body).not.toMatch(/\.\./);
      }),
      { numRuns: 1000 },
    );
  });
});
