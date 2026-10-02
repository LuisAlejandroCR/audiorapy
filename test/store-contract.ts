// store-contract.ts: the behavior every SchedulingStore must have, run against memory, PGlite and a
// real Postgres. Synthetic contacts only.
import { describe, expect, it } from 'vitest';
import { recordConsent } from '@audiorapy/domain';
import { SlotTakenError, type SchedulingStore } from '../apps/api/src/store/store.ts';

const NOW = new Date('2026-10-02T12:00:00.000Z');
const A = '2026-10-05T13:00:00.000Z';
const A_END = '2026-10-05T13:45:00.000Z';

export function storeContract(
  label: string,
  open: () => Promise<{ store: SchedulingStore; done: () => Promise<void> }>,
) {
  const withStore = (fn: (s: SchedulingStore) => Promise<void>) => async () => {
    const { store, done } = await open();
    try {
      await fn(store);
    } finally {
      await done();
    }
  };

  describe(`SchedulingStore contract · ${label}`, () => {
    it(
      'dedupes message ids',
      withStore(async (s) => {
        expect(await s.markProcessed('wamid.1')).toBe(true);
        expect(await s.markProcessed('wamid.1')).toBe(false);
        expect(await s.markProcessed('wamid.2')).toBe(true);
      }),
    );

    it(
      'dedupes concurrent deliveries of the same id: exactly one wins',
      withStore(async (s) => {
        const results = await Promise.all(
          Array.from({ length: 8 }, () => s.markProcessed('wamid.same')),
        );
        expect(results.filter(Boolean)).toHaveLength(1);
      }),
    );

    it(
      'stores conversation state per contact, defaulting to new',
      withStore(async (s) => {
        expect(await s.getConversation('57300')).toEqual({ step: 'new' });
        await s.setConversation('57300', { step: 'choosing_slot', offered: [A], replaces: A });
        await s.setConversation('57300', { step: 'booked', startsAt: A });
        expect(await s.getConversation('57300')).toEqual({ step: 'booked', startsAt: A });
        expect(await s.getConversation('57399')).toEqual({ step: 'new' });
      }),
    );

    it(
      'keeps consent evidence in order',
      withStore(async (s) => {
        const base = {
          contactRef: '57300',
          purpose: 'whatsapp_scheduling' as const,
          textVersion: 'v1',
          text: 'v1',
          channel: 'whatsapp_button' as const,
          childAssent: null,
        };
        await s.addConsent(
          recordConsent({ ...base, granted: true, signedAt: '2026-10-02T10:00:00.000Z' }),
        );
        await s.addConsent(
          recordConsent({ ...base, granted: false, signedAt: '2026-10-03T10:00:00.000Z' }),
        );
        const list = await s.listConsents();
        expect(list.map((c) => c.granted)).toEqual([true, false]);
        expect(list[0]).toMatchObject({
          signedAt: '2026-10-02T10:00:00.000Z',
          signerRole: 'legal_representative',
          revokedAt: null,
          childAssent: null,
        });
      }),
    );

    it(
      'creates, finds and updates appointments with ISO timestamps',
      withStore(async (s) => {
        const appt = await s.createAppointment('57300', A, A_END, NOW);
        expect(appt).toMatchObject({
          contact: '57300',
          startsAt: A,
          endsAt: A_END,
          status: 'scheduled',
          createdAt: NOW.toISOString(),
        });
        expect(await s.findActive('57300', A)).toEqual(appt);
        expect(await s.busyIntervals()).toEqual([{ startsAt: A, endsAt: A_END }]);
        const later = new Date('2026-10-03T00:00:00.000Z');
        expect(await s.updateStatus(appt.id, 'confirmed', later)).toMatchObject({
          status: 'confirmed',
          updatedAt: later.toISOString(),
        });
        expect(await s.findActive('57300', A)).toMatchObject({ status: 'confirmed' });
        await s.updateStatus(appt.id, 'cancelled_by_caregiver', later);
        expect(await s.findActive('57300', A)).toBeNull();
        expect(await s.busyIntervals()).toEqual([]);
      }),
    );

    it(
      'returns null / false for unknown or malformed ids instead of throwing',
      withStore(async (s) => {
        expect(await s.getAppointment('not-a-uuid')).toBeNull();
        expect(await s.getAppointment('00000000-0000-0000-0000-000000000000')).toBeNull();
        expect(
          await s.updateStatus("x'; DROP TABLE appointments; --", 'confirmed', NOW),
        ).toBeNull();
        expect(await s.resolveAlert('nope')).toBe(false);
      }),
    );

    it(
      'reminder jobs: idempotent per kind, due by time, skipped when the visit is cancelled',
      withStore(async (s) => {
        const appt = await s.createAppointment('57300', A, A_END, NOW);
        await s.addJob(appt.id, 'day_before', '2026-10-04T13:00:00.000Z');
        await s.addJob(appt.id, 'day_before', '2026-10-01T00:00:00.000Z');
        await s.addJob(appt.id, 'no_reply_check', '2026-10-05T01:00:00.000Z');
        expect(await s.listJobs()).toHaveLength(2);
        expect((await s.dueJobs(new Date('2026-10-04T13:00:00.000Z'))).map((j) => j.kind)).toEqual([
          'day_before',
        ]);
        await s.setJobState(`${appt.id}:day_before`, 'sent');
        expect(await s.dueJobs(new Date('2026-10-04T13:00:00.000Z'))).toEqual([]);
        await s.updateStatus(appt.id, 'late_cancel', NOW);
        expect((await s.listJobs()).find((j) => j.kind === 'no_reply_check')?.state).toBe(
          'skipped',
        );
        expect((await s.listJobs()).find((j) => j.kind === 'day_before')?.state).toBe('sent');
      }),
    );

    it(
      'purge drops expired message ids and finished old jobs, nothing else',
      withStore(async (s) => {
        const day = 86_400_000;
        const now = new Date('2026-12-01T12:00:00.000Z');
        await s.markProcessed('old', new Date(now.getTime() - 20 * day));
        await s.markProcessed('recent', new Date(now.getTime() - 2 * day));
        const appt = await s.createAppointment('57300', A, A_END, NOW);
        await s.addJob(appt.id, 'early', '2026-10-01T00:00:00.000Z');
        await s.addJob(appt.id, 'day_before', '2026-10-04T13:00:00.000Z');
        await s.addJob(appt.id, 'no_reply_check', '2026-10-05T01:00:00.000Z');
        await s.setJobState(`${appt.id}:early`, 'sent');
        await s.setJobState(`${appt.id}:day_before`, 'skipped');
        await s.addAlert('57300', appt.id, 'no_reply', NOW);

        expect(await s.purge(now)).toEqual({ processedMessages: 1, reminderJobs: 2 });
        expect(await s.markProcessed('old', now)).toBe(true);
        expect(await s.markProcessed('recent', now)).toBe(false);
        expect((await s.listJobs()).map((j) => j.kind)).toEqual(['no_reply_check']);
        expect(await s.getAppointment(appt.id)).not.toBeNull();
        expect(await s.listAlerts()).toHaveLength(1);
        expect(await s.purge(now)).toEqual({ processedMessages: 0, reminderJobs: 0 });
      }),
    );

    it(
      'never two overlapping active appointments; back-to-back and cancelled slots are fine',
      withStore(async (s) => {
        const at = (h: number, m = 0) => new Date(Date.UTC(2026, 9, 5, h, m)).toISOString();
        const first = await s.createAppointment('57300', at(13), at(13, 45), NOW);
        await expect(
          s.createAppointment('57311', at(13, 30), at(14, 15), NOW),
        ).rejects.toBeInstanceOf(SlotTakenError);
        expect(
          await s.book({ contact: '57311', startsAt: at(13, 30), endsAt: at(14, 15), now: NOW }),
        ).toEqual({ ok: false, reason: 'slot_taken' });
        const next = await s.book({
          contact: '57311',
          startsAt: at(13, 45),
          endsAt: at(14, 30),
          now: NOW,
        });
        expect(next.ok).toBe(true);
        await s.updateStatus(first.id, 'cancelled_by_caregiver', NOW);
        expect(
          (await s.book({ contact: '57322', startsAt: at(13), endsAt: at(13, 45), now: NOW })).ok,
        ).toBe(true);
        await expect(s.updateStatus(first.id, 'scheduled', NOW)).rejects.toBeInstanceOf(
          SlotTakenError,
        );
      }),
    );

    it(
      'rescheduling is atomic: into an overlapping own slot works, a lost race keeps the old visit',
      withStore(async (s) => {
        const at = (h: number, m = 0) => new Date(Date.UTC(2026, 9, 6, h, m)).toISOString();
        const mine = await s.createAppointment('57300', at(13), at(13, 45), NOW);
        await s.addJob(mine.id, 'day_before', '2026-10-05T13:00:00.000Z');
        const moved = await s.book({
          contact: '57300',
          startsAt: at(13, 30),
          endsAt: at(14, 15),
          now: NOW,
          replaces: mine.id,
        });
        expect(moved.ok).toBe(true);
        expect((await s.getAppointment(mine.id))?.status).toBe('cancelled_by_caregiver');

        const other = await s.createAppointment('57311', at(16), at(16, 45), NOW);
        const keep = moved.ok ? moved.appointment : mine;
        await s.addJob(keep.id, 'day_before', '2026-10-05T13:30:00.000Z');
        expect(
          await s.book({
            contact: '57300',
            startsAt: at(16, 15),
            endsAt: at(17),
            now: NOW,
            replaces: keep.id,
          }),
        ).toEqual({ ok: false, reason: 'slot_taken' });
        expect((await s.getAppointment(keep.id))?.status).toBe('scheduled');
        expect((await s.listJobs()).find((j) => j.appointmentId === keep.id)?.state).toBe(
          'pending',
        );
        expect((await s.getAppointment(other.id))?.status).toBe('scheduled');
      }),
    );

    it(
      'concurrent bookings of the same slot: exactly one wins',
      withStore(async (s) => {
        const start = '2026-10-07T13:00:00.000Z';
        const end = '2026-10-07T13:45:00.000Z';
        const results = await Promise.all(
          Array.from({ length: 8 }, (_, i) =>
            s.book({ contact: `5730${i}`, startsAt: start, endsAt: end, now: NOW }),
          ),
        );
        expect(results.filter((r) => r.ok)).toHaveLength(1);
        expect(results.filter((r) => !r.ok).every((r) => !r.ok && r.reason === 'slot_taken')).toBe(
          true,
        );
        expect(await s.busyIntervals()).toEqual([{ startsAt: start, endsAt: end }]);
      }),
    );

    it(
      'alerts keep insertion order and can be resolved',
      withStore(async (s) => {
        const appt = await s.createAppointment('57300', A, A_END, NOW);
        const first = await s.addAlert('57300', appt.id, 'no_reply', NOW);
        await s.addAlert('57311', null, 'question', NOW);
        expect((await s.listAlerts()).map((a) => a.reason)).toEqual(['no_reply', 'question']);
        expect(await s.resolveAlert(first.id)).toBe(true);
        expect((await s.listAlerts())[0]).toMatchObject({ resolved: true, appointmentId: appt.id });
      }),
    );
  });
}
