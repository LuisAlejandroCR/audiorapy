// store.invariant.spec.ts: differential property — for any sequence of operations, the Postgres store
// (PGlite) answers exactly like the in-memory reference. Ids are normalized to their creation order.
// Every sequence starts with three appointments; indices 0-3 then mostly hit real rows.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { APPOINTMENT_STATUSES } from '@audiorapy/domain';
import { MemoryStore } from '../../../apps/api/src/store/memory-store.ts';
import { SlotTakenError, type SchedulingStore } from '../../../apps/api/src/store/store.ts';
import { openPglite } from '../../pg-helpers.ts';

const contacts = ['57300', '57311', 'BSUID.x'];
const starts = ['2026-10-05T13:00:00.000Z', '2026-10-05T14:00:00.000Z', '2026-10-06T13:00:00.000Z'];
const NOW = new Date('2026-10-02T12:00:00.000Z');
const endOf = (start: string) => new Date(Date.parse(start) + 45 * 60_000).toISOString();

type Op =
  | { op: 'mark'; id: string }
  | { op: 'create'; c: number; s: number }
  | { op: 'book'; c: number; s: number; r: number | null }
  | { op: 'status'; a: number; status: (typeof APPOINTMENT_STATUSES)[number] }
  | { op: 'job'; a: number; kind: 'early' | 'day_before' | 'no_reply_check'; h: number }
  | {
      op: 'jobState';
      a: number;
      kind: 'early' | 'day_before' | 'no_reply_check';
      state: 'sent' | 'skipped';
    }
  | { op: 'alert'; c: number; a: number | null }
  | { op: 'resolve'; i: number }
  | { op: 'conv'; c: number; s: number }
  | { op: 'purge'; days: number };

const opArb: fc.Arbitrary<Op> = fc.oneof(
  fc.record({ op: fc.constant('mark' as const), id: fc.constantFrom('m1', 'm2', 'm3') }),
  fc.record({ op: fc.constant('create' as const), c: fc.nat(2), s: fc.nat(2) }),
  fc.record({
    op: fc.constant('book' as const),
    c: fc.nat(2),
    s: fc.nat(2),
    r: fc.option(fc.nat(3), { nil: null }),
  }),
  fc.record({
    op: fc.constant('status' as const),
    a: fc.nat(3),
    status: fc.constantFrom(...APPOINTMENT_STATUSES),
  }),
  fc.record({
    op: fc.constant('job' as const),
    a: fc.nat(3),
    kind: fc.constantFrom('early' as const, 'day_before' as const, 'no_reply_check' as const),
    h: fc.nat(96),
  }),
  fc.record({
    op: fc.constant('jobState' as const),
    a: fc.nat(3),
    kind: fc.constantFrom('early' as const, 'day_before' as const, 'no_reply_check' as const),
    state: fc.constantFrom('sent' as const, 'skipped' as const),
  }),
  fc.record({
    op: fc.constant('alert' as const),
    c: fc.nat(2),
    a: fc.option(fc.nat(3), { nil: null }),
  }),
  fc.record({ op: fc.constant('resolve' as const), i: fc.nat(3) }),
  fc.record({ op: fc.constant('conv' as const), c: fc.nat(2), s: fc.nat(2) }),
  fc.record({ op: fc.constant('purge' as const), days: fc.integer({ min: 0, max: 60 }) }),
);

async function run(store: SchedulingStore, ops: Op[]) {
  const appts: string[] = [];
  const alerts: string[] = [];
  const answers: unknown[] = [];
  const name = (id: string | null) => (id === null ? null : `#${appts.indexOf(id)}`);
  for (const o of ops) {
    if (o.op === 'mark') answers.push(await store.markProcessed(o.id, NOW));
    if (o.op === 'purge')
      answers.push(await store.purge(new Date(NOW.getTime() + o.days * 86_400_000)));
    if (o.op === 'create') {
      try {
        appts.push(
          (await store.createAppointment(contacts[o.c]!, starts[o.s]!, endOf(starts[o.s]!), NOW))
            .id,
        );
      } catch (error) {
        if (!(error instanceof SlotTakenError)) throw error;
        answers.push('taken');
      }
    }
    if (o.op === 'book') {
      const replaces = o.r !== null ? appts[o.r] : undefined;
      const r = await store.book({
        contact: contacts[o.c]!,
        startsAt: starts[o.s]!,
        endsAt: endOf(starts[o.s]!),
        now: NOW,
        ...(replaces ? { replaces } : {}),
      });
      if (r.ok) appts.push(r.appointment.id);
      answers.push(r.ok ? 'booked' : r.reason);
    }
    if (o.op === 'status' && appts[o.a]) {
      try {
        answers.push((await store.updateStatus(appts[o.a]!, o.status, NOW))?.status);
      } catch (error) {
        if (!(error instanceof SlotTakenError)) throw error;
        answers.push('taken');
      }
    }
    if (o.op === 'job' && appts[o.a])
      await store.addJob(
        appts[o.a]!,
        o.kind,
        new Date(NOW.getTime() + o.h * 3_600_000).toISOString(),
      );
    if (o.op === 'jobState' && appts[o.a])
      await store.setJobState(`${appts[o.a]}:${o.kind}`, o.state);
    if (o.op === 'alert')
      alerts.push(
        (
          await store.addAlert(
            contacts[o.c]!,
            o.a !== null ? (appts[o.a] ?? null) : null,
            'question',
            NOW,
          )
        ).id,
      );
    if (o.op === 'resolve' && alerts[o.i]) answers.push(await store.resolveAlert(alerts[o.i]!));
    if (o.op === 'conv')
      await store.setConversation(contacts[o.c]!, { step: 'booked', startsAt: starts[o.s]! });
  }
  const jobs = (await store.listJobs()).map((j) => ({
    appt: name(j.appointmentId),
    kind: j.kind,
    dueAt: j.dueAt,
    state: j.state,
  }));
  jobs.sort((x, y) => `${x.appt}${x.kind}`.localeCompare(`${y.appt}${y.kind}`));
  const active = (await store.listAppointments()).filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed',
  );
  const overlapFree = active.every((a, i) =>
    active.every(
      (b, j) =>
        i === j ||
        Date.parse(a.endsAt) <= Date.parse(b.startsAt) ||
        Date.parse(b.endsAt) <= Date.parse(a.startsAt),
    ),
  );
  return {
    answers,
    overlapFree,
    appointments: (await Promise.all(appts.map((id) => store.getAppointment(id)))).map(
      (a) => a && { ...a, id: name(a.id) },
    ),
    busy: await store.busyIntervals(),
    jobs,
    // Ties on due time are broken by id, and each store generates its own random ids: compare by
    // due time and the normalized name, which is what callers may rely on.
    due: (await store.dueJobs(new Date(NOW.getTime() + 48 * 3_600_000)))
      .map((j) => `${j.dueAt} ${name(j.appointmentId)}:${j.kind}`)
      .sort(),
    alerts: (await store.listAlerts()).map((a) => ({
      ...a,
      id: alerts.indexOf(a.id),
      appointmentId: name(a.appointmentId),
    })),
    conversations: await Promise.all(contacts.map((c) => store.getConversation(c))),
    active: await Promise.all(
      contacts.flatMap((c) =>
        starts.map(async (s) => (await store.findActive(c, s))?.status ?? null),
      ),
    ),
  };
}

describe('store invariants', () => {
  let pg: Awaited<ReturnType<typeof openPglite>>;
  beforeAll(async () => {
    pg = await openPglite();
  });
  afterAll(async () => pg.done());

  it('Postgres and memory stores agree on every observable result', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(opArb, { maxLength: 30 }), async (tail) => {
        // Three appointments up front so job and status operations land on real ones.
        const ops: Op[] = [0, 1, 2].map((i) => ({ op: 'create', c: i, s: i }) as Op).concat(tail);
        await pg.truncate();
        const expected = await run(new MemoryStore(), ops);
        const actual = await run(pg.store, ops);
        expect(actual).toEqual(expected);
        expect(actual.overlapFree).toBe(true);
      }),
      { numRuns: 150 },
    );
  });
});
