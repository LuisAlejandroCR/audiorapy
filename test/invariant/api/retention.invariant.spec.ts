// retention.invariant.spec.ts: for any data and any purge time, purge never removes a pending reminder,
// an appointment, a consent, an alert, or a message id still inside the redelivery window — and it does
// remove every finished job and every message id past their cutoffs.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { recordConsent } from '@audiorapy/domain';
import { MemoryStore } from '../../../apps/api/src/store/memory-store.ts';
import { purgeCutoffs } from '../../../apps/api/src/store/store.ts';

const DAY = 86_400_000;
const NOW = new Date('2026-12-01T00:00:00.000Z').getTime();
const kinds = ['early', 'day_before', 'no_reply_check'] as const;

describe('retention invariants', () => {
  it('purge keeps what must stay and removes what expired', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 0, max: 60 }), { maxLength: 10 }),
        fc.array(
          fc.record({
            k: fc.constantFrom(...kinds),
            daysAgo: fc.integer({ min: -10, max: 90 }),
            state: fc.constantFrom('pending' as const, 'sent' as const, 'skipped' as const),
          }),
          { maxLength: 6 },
        ),
        fc.integer({ min: 0, max: 5 }),
        async (messageAges, jobs, alerts) => {
          const s = new MemoryStore();
          const now = new Date(NOW);
          for (const [i, d] of messageAges.entries())
            await s.markProcessed(`m${i}`, new Date(NOW - d * DAY));
          const appt = await s.createAppointment(
            '57300',
            '2026-12-10T13:00:00.000Z',
            '2026-12-10T13:45:00.000Z',
            new Date(NOW - 100 * DAY),
          );
          const added = new Map<(typeof kinds)[number], (typeof jobs)[number]>();
          for (const j of jobs) {
            if (added.has(j.k)) continue;
            added.set(j.k, j);
            await s.addJob(appt.id, j.k, new Date(NOW - j.daysAgo * DAY).toISOString());
            await s.setJobState(`${appt.id}:${j.k}`, j.state);
          }
          for (let i = 0; i < alerts; i++) await s.addAlert('57300', appt.id, 'question', now);
          await s.addConsent(
            recordConsent({
              contactRef: '57300',
              purpose: 'whatsapp_scheduling',
              granted: true,
              textVersion: 'v1',
              text: 'v1',
              signedAt: now.toISOString(),
              channel: 'whatsapp_button',
              childAssent: null,
            }),
          );

          await s.purge(now);
          const { processedBefore, jobsDueBefore } = purgeCutoffs(now);

          for (const [i, d] of messageAges.entries()) {
            const expired = NOW - d * DAY < processedBefore.getTime();
            expect(await s.markProcessed(`m${i}`, now), `m${i} ${d}d`).toBe(expired);
          }
          const left = new Map((await s.listJobs()).map((j) => [j.kind, j]));
          for (const [k, j] of added) {
            const expired =
              j.state !== 'pending' && NOW - j.daysAgo * DAY < jobsDueBefore.getTime();
            expect(left.has(k), `${k} ${j.state} ${j.daysAgo}d`).toBe(!expired);
          }
          expect(await s.getAppointment(appt.id)).not.toBeNull();
          expect(await s.listAlerts()).toHaveLength(alerts);
          expect(await s.listConsents()).toHaveLength(1);
        },
      ),
      { numRuns: 500 },
    );
  });
});
