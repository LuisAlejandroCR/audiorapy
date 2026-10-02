// appointment.spec.ts: reminder cadence by risk and the outcome of each reminder reply.
import { describe, expect, it } from 'vitest';
import { applyReminderReply, planReminders } from '@audiorapy/domain';

const visit = new Date('2026-10-09T14:00:00Z');
const now = new Date('2026-10-02T14:00:00Z');

describe('planReminders', () => {
  it('fixed cadence without risk: day before and a no-reply check', () => {
    expect(planReminders(visit, now, null)).toEqual([
      { kind: 'day_before', dueAt: '2026-10-08T14:00:00.000Z' },
      { kind: 'no_reply_check', dueAt: '2026-10-09T02:00:00.000Z' },
    ]);
  });

  it('adds a 72 h reminder for medium or high risk', () => {
    expect(planReminders(visit, now, 'high')[0]).toEqual({
      kind: 'early',
      dueAt: '2026-10-06T14:00:00.000Z',
    });
    expect(planReminders(visit, now, 'low')).toHaveLength(2);
  });

  it('drops reminders that are already in the past', () => {
    expect(planReminders(visit, new Date('2026-10-08T20:00:00Z'), 'high')).toEqual([
      { kind: 'no_reply_check', dueAt: '2026-10-09T02:00:00.000Z' },
    ]);
  });
});

describe('applyReminderReply', () => {
  it('confirm → confirmed', () => {
    expect(applyReminderReply('scheduled', 'confirm', visit, now)).toEqual({
      status: 'confirmed',
      alertTherapist: false,
    });
  });

  it('cancel early → cancelled_by_caregiver; inside 24 h → late_cancel', () => {
    expect(applyReminderReply('scheduled', 'cancel', visit, now).status).toBe(
      'cancelled_by_caregiver',
    );
    expect(
      applyReminderReply('confirmed', 'cancel', visit, new Date('2026-10-09T02:00:00Z')).status,
    ).toBe('late_cancel');
  });

  it('no reply never cancels; it alerts the therapist', () => {
    expect(applyReminderReply('scheduled', 'none', visit, now)).toEqual({
      status: 'scheduled',
      alertTherapist: true,
      reason: 'no_reply',
    });
  });

  it('closed appointments do not change', () => {
    expect(applyReminderReply('attended', 'cancel', visit, now)).toEqual({
      status: 'attended',
      alertTherapist: false,
    });
  });
});
