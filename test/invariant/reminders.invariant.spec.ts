// reminders.invariant.spec.ts: A6 — silence never cancels; reminders are always before the visit and after now.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { APPOINTMENT_STATUSES, applyReminderReply, planReminders } from '@audiorapy/domain';

const date = fc.date({
  min: new Date('2026-01-01'),
  max: new Date('2027-12-31'),
  noInvalidDate: true,
});
const status = fc.constantFrom(...APPOINTMENT_STATUSES);
const band = fc.constantFrom('low' as const, 'medium' as const, 'high' as const, null);

describe('reminder invariants', () => {
  it('only an explicit cancel reply moves an appointment to a cancelled state', () => {
    fc.assert(
      fc.property(
        status,
        fc.constantFrom('confirm' as const, 'reschedule' as const, 'none' as const),
        date,
        date,
        (s, reply, startsAt, at) => {
          const out = applyReminderReply(s, reply, startsAt, at);
          if (s !== 'late_cancel' && s !== 'cancelled_by_caregiver') {
            expect(['late_cancel', 'cancelled_by_caregiver']).not.toContain(out.status);
          }
          if (s !== 'no_show') expect(out.status).not.toBe('no_show');
        },
      ),
      { numRuns: 2000 },
    );
  });

  it('silence on an unconfirmed visit always alerts the therapist', () => {
    fc.assert(
      fc.property(date, date, (startsAt, at) => {
        expect(applyReminderReply('scheduled', 'none', startsAt, at)).toEqual({
          status: 'scheduled',
          alertTherapist: true,
          reason: 'no_reply',
        });
      }),
    );
  });

  it('every planned reminder is after now and before the visit, sorted', () => {
    fc.assert(
      fc.property(date, date, band, (startsAt, now, b) => {
        const plan = planReminders(startsAt, now, b);
        const times = plan.map((r) => Date.parse(r.dueAt));
        for (const t of times) {
          expect(t).toBeGreaterThan(now.getTime());
          expect(t).toBeLessThan(startsAt.getTime());
        }
        expect([...times].sort((x, y) => x - y)).toEqual(times);
      }),
      { numRuns: 2000 },
    );
  });
});
