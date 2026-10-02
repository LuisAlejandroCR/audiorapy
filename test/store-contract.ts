// store-contract.ts: the behavior every SchedulingStore must have, run against memory, PGlite and a
// real Postgres. Synthetic contacts only.
import { describe, expect, it } from 'vitest';
import { recordConsent } from '@audiorapy/domain';
import type { SchedulingStore } from '../apps/api/src/store/store.ts';

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
