// appointment.ts: appointment status, reminder planning and reminder outcomes.
// No path in this file cancels an appointment for lack of a reply; silence alerts the therapist.
import type { RiskBand } from './risk.ts';
import { addMinutes } from './time.ts';

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'attended',
  'late_cancel',
  'no_show',
  'cancelled_by_caregiver',
  'cancelled_by_therapist',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type ReminderKind = 'early' | 'day_before' | 'no_reply_check';

export interface PlannedReminder {
  kind: ReminderKind;
  dueAt: string;
}

const HOUR = 60;

/** Reminder plan for one visit. Higher no-show risk adds an earlier reminder; null risk = fixed cadence. */
export function planReminders(startsAt: Date, now: Date, band: RiskBand | null): PlannedReminder[] {
  const plan: Array<[ReminderKind, number]> = [
    ['day_before', 24 * HOUR],
    ['no_reply_check', 12 * HOUR],
  ];
  if (band === 'high' || band === 'medium') plan.unshift(['early', 72 * HOUR]);
  return plan
    .map(([kind, before]) => ({ kind, due: addMinutes(startsAt, -before) }))
    .filter((r) => r.due.getTime() > now.getTime())
    .map((r) => ({ kind: r.kind, dueAt: r.due.toISOString() }));
}

export type ReminderReply = 'confirm' | 'reschedule' | 'cancel' | 'none';

export type ReminderOutcome =
  | { status: AppointmentStatus; alertTherapist: false }
  | {
      status: AppointmentStatus;
      alertTherapist: true;
      reason: 'no_reply' | 'reschedule_requested';
    };

const CANCEL_CUTOFF_HOURS = 24;

/** What a reminder reply (or its absence) does to an appointment. */
export function applyReminderReply(
  status: AppointmentStatus,
  reply: ReminderReply,
  startsAt: Date,
  at: Date,
): ReminderOutcome {
  if (status !== 'scheduled' && status !== 'confirmed') return { status, alertTherapist: false };
  switch (reply) {
    case 'confirm':
      return { status: 'confirmed', alertTherapist: false };
    case 'cancel': {
      const hoursBefore = (startsAt.getTime() - at.getTime()) / 3_600_000;
      return {
        status: hoursBefore < CANCEL_CUTOFF_HOURS ? 'late_cancel' : 'cancelled_by_caregiver',
        alertTherapist: false,
      };
    }
    case 'reschedule':
      return { status, alertTherapist: true, reason: 'reschedule_requested' };
    case 'none':
      return status === 'scheduled'
        ? { status, alertTherapist: true, reason: 'no_reply' }
        : { status, alertTherapist: false };
  }
}
