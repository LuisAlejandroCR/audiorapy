// memory-store.ts: in-memory scheduling store, for development and tests. Lost on restart.
import { randomUUID } from 'node:crypto';
import type {
  AppointmentStatus,
  ConsentRecord,
  ConversationState,
  Interval,
  ReminderKind,
} from '@audiorapy/domain';
import {
  ACTIVE_STATUSES,
  DEFAULT_SCHEDULE,
  type Alert,
  type AlertReason,
  type Appointment,
  type ReminderJob,
  type Schedule,
  type SchedulingStore,
} from './store.ts';

export * from './store.ts';

const PROCESSED_CAP = 10_000;

export class MemoryStore implements SchedulingStore {
  readonly name = 'memory';
  schedule: Schedule = DEFAULT_SCHEDULE;
  private readonly conversations = new Map<string, ConversationState>();
  private readonly appointments = new Map<string, Appointment>();
  private readonly consents: ConsentRecord[] = [];
  private readonly jobs = new Map<string, ReminderJob>();
  private readonly alerts: Alert[] = [];
  private readonly processed = new Set<string>();

  async markProcessed(messageId: string): Promise<boolean> {
    if (this.processed.has(messageId)) return false;
    this.processed.add(messageId);
    if (this.processed.size > PROCESSED_CAP)
      this.processed.delete(this.processed.values().next().value!);
    return true;
  }

  async getConversation(contact: string): Promise<ConversationState> {
    return structuredClone(this.conversations.get(contact) ?? { step: 'new' });
  }

  async setConversation(contact: string, state: ConversationState): Promise<void> {
    this.conversations.set(contact, structuredClone(state));
  }

  async addConsent(record: ConsentRecord): Promise<void> {
    this.consents.push({ ...record });
  }

  async listConsents(): Promise<ConsentRecord[]> {
    return this.consents.map((c) => ({ ...c }));
  }

  async createAppointment(
    contact: string,
    startsAt: string,
    endsAt: string,
    now: Date,
  ): Promise<Appointment> {
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
    return { ...appt };
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    now: Date,
  ): Promise<Appointment | null> {
    const appt = this.appointments.get(id);
    if (!appt) return null;
    appt.status = status;
    appt.updatedAt = now.toISOString();
    if (!ACTIVE_STATUSES.includes(status)) {
      for (const job of this.jobs.values())
        if (job.appointmentId === id && job.state === 'pending') job.state = 'skipped';
    }
    return { ...appt };
  }

  async getAppointment(id: string): Promise<Appointment | null> {
    const a = this.appointments.get(id);
    return a ? { ...a } : null;
  }

  async findActive(contact: string, startsAt: string): Promise<Appointment | null> {
    for (const a of this.appointments.values()) {
      if (a.contact === contact && a.startsAt === startsAt && ACTIVE_STATUSES.includes(a.status))
        return { ...a };
    }
    return null;
  }

  async listAppointments(): Promise<Appointment[]> {
    return [...this.appointments.values()]
      .map((a) => ({ ...a }))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  async busyIntervals(): Promise<Interval[]> {
    return (await this.listAppointments())
      .filter((a) => ACTIVE_STATUSES.includes(a.status))
      .map((a) => ({ startsAt: a.startsAt, endsAt: a.endsAt }));
  }

  async addJob(appointmentId: string, kind: ReminderKind, dueAt: string): Promise<ReminderJob> {
    const id = `${appointmentId}:${kind}`;
    if (!this.jobs.has(id)) this.jobs.set(id, { id, appointmentId, kind, dueAt, state: 'pending' });
    return { ...this.jobs.get(id)! };
  }

  async dueJobs(now: Date): Promise<ReminderJob[]> {
    return [...this.jobs.values()]
      .filter((j) => j.state === 'pending' && Date.parse(j.dueAt) <= now.getTime())
      .map((j) => ({ ...j }))
      .sort((a, b) =>
        a.dueAt < b.dueAt ? -1 : a.dueAt > b.dueAt ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
      );
  }

  async setJobState(id: string, state: ReminderJob['state']): Promise<void> {
    const job = this.jobs.get(id);
    if (job) job.state = state;
  }

  async listJobs(): Promise<ReminderJob[]> {
    return [...this.jobs.values()].map((j) => ({ ...j }));
  }

  async addAlert(
    contact: string,
    appointmentId: string | null,
    reason: AlertReason,
    now: Date,
  ): Promise<Alert> {
    const alert: Alert = {
      id: randomUUID(),
      contact,
      appointmentId,
      reason,
      at: now.toISOString(),
      resolved: false,
    };
    this.alerts.push(alert);
    return { ...alert };
  }

  async listAlerts(): Promise<Alert[]> {
    return this.alerts.map((a) => ({ ...a }));
  }

  async resolveAlert(id: string): Promise<boolean> {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return false;
    alert.resolved = true;
    return true;
  }

  async close(): Promise<void> {}
}
