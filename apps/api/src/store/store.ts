// store.ts: the scheduling store contract. It holds only the messaging plane — contacts, consent
// evidence, appointment time and status, reminder jobs, alerts — never clinical content.
import type {
  AppointmentStatus,
  ConsentRecord,
  ConversationState,
  EscalationReason,
  Interval,
  ReminderKind,
  WeeklyWindow,
} from '@audiorapy/domain';

export interface Appointment {
  id: string;
  contact: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderJob {
  id: string;
  appointmentId: string;
  kind: ReminderKind;
  dueAt: string;
  state: 'pending' | 'sent' | 'skipped';
}

export type AlertReason = EscalationReason | 'no_reply' | 'reschedule_requested' | 'cancelled';

export interface Alert {
  id: string;
  contact: string;
  appointmentId: string | null;
  reason: AlertReason;
  at: string;
  resolved: boolean;
}

export interface Schedule {
  windows: WeeklyWindow[];
  durationMinutes: number;
  bufferMinutes: number;
  minLeadMinutes: number;
  horizonDays: number;
  stepMinutes: number;
  holidays: string[];
}

export const DEFAULT_SCHEDULE: Schedule = {
  windows: [1, 2, 3, 4, 5].flatMap((weekday) => [
    { weekday, start: '08:00', end: '12:00' },
    { weekday, start: '14:00', end: '18:00' },
  ]),
  durationMinutes: 45,
  bufferMinutes: 30,
  minLeadMinutes: 12 * 60,
  horizonDays: 14,
  stepMinutes: 30,
  holidays: [],
};

/**
 * Retention for operational records. Processed message ids only need to outlive the provider's
 * redelivery window; finished reminder jobs only matter for a few weeks. Appointments, consent
 * evidence and alerts are never purged here.
 */
export const RETENTION = { processedMessagesDays: 14, finishedJobsDays: 30 } as const;

export interface PurgeResult {
  processedMessages: number;
  reminderJobs: number;
}

const DAY_MS = 86_400_000;

export function purgeCutoffs(now: Date) {
  return {
    processedBefore: new Date(now.getTime() - RETENTION.processedMessagesDays * DAY_MS),
    jobsDueBefore: new Date(now.getTime() - RETENTION.finishedJobsDays * DAY_MS),
  };
}

export const ACTIVE_STATUSES: readonly AppointmentStatus[] = ['scheduled', 'confirmed'];

export interface SchedulingStore {
  readonly name: string;
  schedule: Schedule;
  /** Records a message id; false when it was already processed (a redelivery). Atomic. */
  markProcessed(messageId: string, at?: Date): Promise<boolean>;
  getConversation(contact: string): Promise<ConversationState>;
  setConversation(contact: string, state: ConversationState): Promise<void>;
  addConsent(record: ConsentRecord): Promise<void>;
  listConsents(): Promise<ConsentRecord[]>;
  createAppointment(
    contact: string,
    startsAt: string,
    endsAt: string,
    now: Date,
  ): Promise<Appointment>;
  /** Leaving an active status skips that appointment's pending reminder jobs. */
  updateStatus(id: string, status: AppointmentStatus, now: Date): Promise<Appointment | null>;
  getAppointment(id: string): Promise<Appointment | null>;
  findActive(contact: string, startsAt: string): Promise<Appointment | null>;
  listAppointments(): Promise<Appointment[]>;
  busyIntervals(): Promise<Interval[]>;
  /** Idempotent per (appointment, kind). */
  addJob(appointmentId: string, kind: ReminderKind, dueAt: string): Promise<ReminderJob>;
  dueJobs(now: Date): Promise<ReminderJob[]>;
  setJobState(id: string, state: ReminderJob['state']): Promise<void>;
  listJobs(): Promise<ReminderJob[]>;
  addAlert(
    contact: string,
    appointmentId: string | null,
    reason: AlertReason,
    now: Date,
  ): Promise<Alert>;
  listAlerts(): Promise<Alert[]>;
  resolveAlert(id: string): Promise<boolean>;
  /** Deletes expired processed ids and finished (sent/skipped) reminder jobs; see RETENTION. */
  purge(now: Date): Promise<PurgeResult>;
  close(): Promise<void>;
}
