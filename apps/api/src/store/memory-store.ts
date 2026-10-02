// memory-store.ts: in-memory implementation of the scheduling store. Holds only the messaging plane
// (contacts, consent evidence, appointment time/status, reminder jobs); nothing clinical.
import { randomUUID } from 'node:crypto';
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

const ACTIVE: AppointmentStatus[] = ['scheduled', 'confirmed'];
const PROCESSED_CAP = 10_000;

export class MemoryStore {
  schedule: Schedule = DEFAULT_SCHEDULE;
  private readonly conversations = new Map<string, ConversationState>();
  private readonly appointments = new Map<string, Appointment>();
  private readonly consents: ConsentRecord[] = [];
  private readonly jobs = new Map<string, ReminderJob>();
  private readonly alerts: Alert[] = [];
  private readonly processed = new Set<string>();

  /** Records a message id; false when it was already processed (a redelivery). */
  markProcessed(messageId: string): boolean {
    if (this.processed.has(messageId)) return false;
    this.processed.add(messageId);
    if (this.processed.size > PROCESSED_CAP)
      this.processed.delete(this.processed.values().next().value!);
    return true;
  }

  getConversation(contact: string): ConversationState {
    return this.conversations.get(contact) ?? { step: 'new' };
  }

  setConversation(contact: string, state: ConversationState) {
    this.conversations.set(contact, state);
  }

  addConsent(record: ConsentRecord) {
    this.consents.push(record);
  }

  listConsents(): readonly ConsentRecord[] {
    return this.consents;
  }

  createAppointment(contact: string, startsAt: string, endsAt: string, now: Date): Appointment {
    const appt: Appointment = {
      id: randomUUID(),
      contact,
      startsAt,
      endsAt,
      status: 'scheduled',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.appointments.set(appt.id, appt);
    return appt;
  }

  updateStatus(id: string, status: AppointmentStatus, now: Date): Appointment | null {
    const appt = this.appointments.get(id);
    if (!appt) return null;
    appt.status = status;
    appt.updatedAt = now.toISOString();
    if (!ACTIVE.includes(status)) {
      for (const job of this.jobs.values())
        if (job.appointmentId === id && job.state === 'pending') job.state = 'skipped';
    }
    return appt;
  }

  getAppointment(id: string): Appointment | null {
    return this.appointments.get(id) ?? null;
  }

  findActive(contact: string, startsAt: string): Appointment | null {
    for (const a of this.appointments.values()) {
      if (a.contact === contact && a.startsAt === startsAt && ACTIVE.includes(a.status)) return a;
    }
    return null;
  }

  listAppointments(): Appointment[] {
    return [...this.appointments.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  busyIntervals(): Interval[] {
    return this.listAppointments()
      .filter((a) => ACTIVE.includes(a.status))
      .map((a) => ({ startsAt: a.startsAt, endsAt: a.endsAt }));
  }

  addJob(appointmentId: string, kind: ReminderKind, dueAt: string): ReminderJob {
    const job: ReminderJob = {
      id: `${appointmentId}:${kind}`,
      appointmentId,
      kind,
      dueAt,
      state: 'pending',
    };
    if (!this.jobs.has(job.id)) this.jobs.set(job.id, job);
    return this.jobs.get(job.id)!;
  }

  dueJobs(now: Date): ReminderJob[] {
    return [...this.jobs.values()]
      .filter((j) => j.state === 'pending' && Date.parse(j.dueAt) <= now.getTime())
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  }

  listJobs(): ReminderJob[] {
    return [...this.jobs.values()];
  }

  addAlert(contact: string, appointmentId: string | null, reason: AlertReason, now: Date): Alert {
    const alert: Alert = {
      id: randomUUID(),
      contact,
      appointmentId,
      reason,
      at: now.toISOString(),
      resolved: false,
    };
    this.alerts.push(alert);
    return alert;
  }

  listAlerts(): readonly Alert[] {
    return this.alerts;
  }

  resolveAlert(id: string): boolean {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return false;
    alert.resolved = true;
    return true;
  }
}
