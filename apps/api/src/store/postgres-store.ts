// postgres-store.ts: the scheduling store on Postgres (Render Postgres in production, PGlite in tests).
// Talks to any client with pg's `query(text, params)` shape; every statement is parameterized.
import { randomUUID } from 'node:crypto';
import type {
  AppointmentStatus,
  ConsentRecord,
  ConversationState,
  Interval,
  ReminderKind,
} from '@audiorapy/domain';
import { SCHEMA } from './schema.ts';
import {
  ACTIVE_STATUSES,
  DEFAULT_SCHEDULE,
  type Alert,
  type AlertReason,
  type Appointment,
  type BookInput,
  type BookResult,
  SlotTakenError,
  type ReminderJob,
  type PurgeResult,
  type Schedule,
  type SchedulingStore,
  purgeCutoffs,
} from './store.ts';

type Row = Record<string, unknown>;

type Query = (text: string, params?: unknown[]) => Promise<{ rows: Row[] }>;

export interface SqlClient {
  query: Query;
  end?(): Promise<void>;
  close?(): Promise<void>;
  /** pg Pool: a dedicated connection for a transaction. */
  connect?(): Promise<{ query: Query; release(): void }>;
  /** PGlite: runs the callback inside a transaction. */
  transaction?<T>(fn: (tx: { query: Query }) => Promise<T>): Promise<T>;
}

const EXCLUSION_VIOLATION = '23P01';
const isOverlap = (error: unknown) =>
  (error as { code?: string } | null)?.code === EXCLUSION_VIOLATION;

const iso = (v: unknown): string => new Date(v as string | Date).toISOString();
const isoOrNull = (v: unknown): string | null => (v === null || v === undefined ? null : iso(v));

function toAppointment(r: Row): Appointment {
  return {
    id: String(r.id),
    contact: String(r.contact),
    startsAt: iso(r.starts_at),
    endsAt: iso(r.ends_at),
    status: r.status as AppointmentStatus,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function toJob(r: Row): ReminderJob {
  return {
    id: String(r.id),
    appointmentId: String(r.appointment_id),
    kind: r.kind as ReminderKind,
    dueAt: iso(r.due_at),
    state: r.state as ReminderJob['state'],
  };
}

function toAlert(r: Row): Alert {
  return {
    id: String(r.id),
    contact: String(r.contact),
    appointmentId: r.appointment_id === null ? null : String(r.appointment_id),
    reason: r.reason as AlertReason,
    at: iso(r.at),
    resolved: Boolean(r.resolved),
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const APPT_COLUMNS = 'id, contact, starts_at, ends_at, status, created_at, updated_at';

export class PostgresStore implements SchedulingStore {
  readonly name = 'postgres';
  schedule: Schedule = DEFAULT_SCHEDULE;

  private constructor(private readonly sql: SqlClient) {}

  /** Creates the store and applies the (idempotent) schema. */
  static async open(sql: SqlClient): Promise<PostgresStore> {
    for (const statement of SCHEMA) await sql.query(statement);
    return new PostgresStore(sql);
  }

  async markProcessed(messageId: string, at: Date = new Date()): Promise<boolean> {
    const r = await this.sql.query(
      'INSERT INTO processed_messages (id, processed_at) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING RETURNING id',
      [messageId, at.toISOString()],
    );
    return r.rows.length === 1;
  }

  async getConversation(contact: string): Promise<ConversationState> {
    const r = await this.sql.query('SELECT state FROM conversations WHERE contact = $1', [contact]);
    const state = r.rows[0]?.state;
    if (!state) return { step: 'new' };
    return (typeof state === 'string' ? JSON.parse(state) : state) as ConversationState;
  }

  async setConversation(contact: string, state: ConversationState): Promise<void> {
    await this.sql.query(
      `INSERT INTO conversations (contact, state, updated_at) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (contact) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
      [contact, JSON.stringify(state)],
    );
  }

  async addConsent(c: ConsentRecord): Promise<void> {
    await this.sql.query(
      `INSERT INTO consents (contact_ref, purpose, granted, text_version, text_hash, signed_at, signer_role, channel, child_assent, revoked_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        c.contactRef,
        c.purpose,
        c.granted,
        c.textVersion,
        c.textHash,
        c.signedAt,
        c.signerRole,
        c.channel,
        c.childAssent,
        c.revokedAt,
      ],
    );
  }

  async listConsents(): Promise<ConsentRecord[]> {
    const r = await this.sql.query('SELECT * FROM consents ORDER BY seq');
    return r.rows.map((x) => ({
      contactRef: String(x.contact_ref),
      purpose: x.purpose as ConsentRecord['purpose'],
      granted: Boolean(x.granted),
      textVersion: String(x.text_version),
      textHash: String(x.text_hash),
      signedAt: iso(x.signed_at),
      signerRole: 'legal_representative',
      channel: x.channel as ConsentRecord['channel'],
      childAssent: x.child_assent === null ? null : Boolean(x.child_assent),
      revokedAt: isoOrNull(x.revoked_at),
    }));
  }

  async createAppointment(
    contact: string,
    startsAt: string,
    endsAt: string,
    now: Date,
  ): Promise<Appointment> {
    const r = await this.sql
      .query(
        `INSERT INTO appointments (id, contact, starts_at, ends_at, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'scheduled', $5, $5) RETURNING ${APPT_COLUMNS}`,
        [randomUUID(), contact, startsAt, endsAt, now.toISOString()],
      )
      .catch((error: unknown) => {
        throw isOverlap(error) ? new SlotTakenError() : error;
      });
    return toAppointment(r.rows[0]!);
  }

  async book({ contact, startsAt, endsAt, now, replaces }: BookInput): Promise<BookResult> {
    try {
      return await this.inTransaction(async (q) => {
        if (replaces && UUID.test(replaces)) {
          const cancelled = await q(
            `UPDATE appointments SET status = 'cancelled_by_caregiver', updated_at = $2
             WHERE id = $1 AND status = ANY($3::text[]) RETURNING id`,
            [replaces, now.toISOString(), [...ACTIVE_STATUSES]],
          );
          if (cancelled.rows.length > 0) {
            await q(
              `UPDATE reminder_jobs SET state = 'skipped' WHERE appointment_id = $1 AND state = 'pending'`,
              [replaces],
            );
          }
        }
        const r = await q(
          `INSERT INTO appointments (id, contact, starts_at, ends_at, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'scheduled', $5, $5) RETURNING ${APPT_COLUMNS}`,
          [randomUUID(), contact, startsAt, endsAt, now.toISOString()],
        );
        return { ok: true as const, appointment: toAppointment(r.rows[0]!) };
      });
    } catch (error) {
      if (isOverlap(error)) return { ok: false, reason: 'slot_taken' };
      throw error;
    }
  }

  /** Runs fn in one transaction on PGlite or a pg Pool; rolls back on any error. */
  private async inTransaction<T>(fn: (q: Query) => Promise<T>): Promise<T> {
    if (this.sql.transaction) return this.sql.transaction((tx) => fn(tx.query.bind(tx)));
    if (this.sql.connect) {
      const client = await this.sql.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(client.query.bind(client));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    }
    return fn(this.sql.query.bind(this.sql));
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    now: Date,
  ): Promise<Appointment | null> {
    if (!UUID.test(id)) return null;
    const r = await this.sql
      .query(
        `UPDATE appointments SET status = $2, updated_at = $3 WHERE id = $1 RETURNING ${APPT_COLUMNS}`,
        [id, status, now.toISOString()],
      )
      .catch((error: unknown) => {
        throw isOverlap(error) ? new SlotTakenError() : error;
      });
    if (r.rows.length === 0) return null;
    if (!ACTIVE_STATUSES.includes(status)) {
      await this.sql.query(
        `UPDATE reminder_jobs SET state = 'skipped' WHERE appointment_id = $1 AND state = 'pending'`,
        [id],
      );
    }
    return toAppointment(r.rows[0]!);
  }

  async getAppointment(id: string): Promise<Appointment | null> {
    if (!UUID.test(id)) return null;
    const r = await this.sql.query(`SELECT ${APPT_COLUMNS} FROM appointments WHERE id = $1`, [id]);
    return r.rows[0] ? toAppointment(r.rows[0]) : null;
  }

  async findActive(contact: string, startsAt: string): Promise<Appointment | null> {
    const r = await this.sql.query(
      `SELECT ${APPT_COLUMNS} FROM appointments
       WHERE contact = $1 AND starts_at = $2 AND status = ANY($3::text[]) ORDER BY created_at LIMIT 1`,
      [contact, startsAt, [...ACTIVE_STATUSES]],
    );
    return r.rows[0] ? toAppointment(r.rows[0]) : null;
  }

  async listAppointments(): Promise<Appointment[]> {
    const r = await this.sql.query(
      `SELECT ${APPT_COLUMNS} FROM appointments ORDER BY starts_at, created_at`,
    );
    return r.rows.map(toAppointment);
  }

  async busyIntervals(): Promise<Interval[]> {
    const r = await this.sql.query(
      'SELECT starts_at, ends_at FROM appointments WHERE status = ANY($1::text[]) ORDER BY starts_at',
      [[...ACTIVE_STATUSES]],
    );
    return r.rows.map((x) => ({ startsAt: iso(x.starts_at), endsAt: iso(x.ends_at) }));
  }

  async addJob(appointmentId: string, kind: ReminderKind, dueAt: string): Promise<ReminderJob> {
    const id = `${appointmentId}:${kind}`;
    await this.sql.query(
      `INSERT INTO reminder_jobs (id, appointment_id, kind, due_at, state) VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (id) DO NOTHING`,
      [id, appointmentId, kind, dueAt],
    );
    const r = await this.sql.query('SELECT * FROM reminder_jobs WHERE id = $1', [id]);
    return toJob(r.rows[0]!);
  }

  async dueJobs(now: Date): Promise<ReminderJob[]> {
    const r = await this.sql.query(
      `SELECT * FROM reminder_jobs WHERE state = 'pending' AND due_at <= $1 ORDER BY due_at, id COLLATE "C"`,
      [now.toISOString()],
    );
    return r.rows.map(toJob);
  }

  async setJobState(id: string, state: ReminderJob['state']): Promise<void> {
    await this.sql.query('UPDATE reminder_jobs SET state = $2 WHERE id = $1', [id, state]);
  }

  async listJobs(): Promise<ReminderJob[]> {
    const r = await this.sql.query('SELECT * FROM reminder_jobs ORDER BY due_at, id COLLATE "C"');
    return r.rows.map(toJob);
  }

  async addAlert(
    contact: string,
    appointmentId: string | null,
    reason: AlertReason,
    now: Date,
  ): Promise<Alert> {
    const r = await this.sql.query(
      'INSERT INTO alerts (id, contact, appointment_id, reason, at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [randomUUID(), contact, appointmentId, reason, now.toISOString()],
    );
    return toAlert(r.rows[0]!);
  }

  async listAlerts(): Promise<Alert[]> {
    const r = await this.sql.query('SELECT * FROM alerts ORDER BY seq');
    return r.rows.map(toAlert);
  }

  async resolveAlert(id: string): Promise<boolean> {
    if (!UUID.test(id)) return false;
    const r = await this.sql.query('UPDATE alerts SET resolved = true WHERE id = $1 RETURNING id', [
      id,
    ]);
    return r.rows.length === 1;
  }

  async purge(now: Date): Promise<PurgeResult> {
    const { processedBefore, jobsDueBefore } = purgeCutoffs(now);
    const processed = await this.sql.query(
      'DELETE FROM processed_messages WHERE processed_at < $1 RETURNING id',
      [processedBefore.toISOString()],
    );
    const jobs = await this.sql.query(
      "DELETE FROM reminder_jobs WHERE state IN ('sent', 'skipped') AND due_at < $1 RETURNING id",
      [jobsDueBefore.toISOString()],
    );
    return { processedMessages: processed.rows.length, reminderJobs: jobs.rows.length };
  }

  async close(): Promise<void> {
    await (this.sql.end?.() ?? this.sql.close?.());
  }
}
