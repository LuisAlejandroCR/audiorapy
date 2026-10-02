// schema.ts: Postgres schema for the scheduling store. Messaging plane only: no table holds clinical
// content, child names or free text from caregivers. Idempotent; runs at startup.

export const APPOINTMENT_STATUS_CHECK =
  "status IN ('scheduled','confirmed','attended','late_cancel','no_show','cancelled_by_caregiver','cancelled_by_therapist')";

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS processed_messages (
     id text PRIMARY KEY,
     processed_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS conversations (
     contact text PRIMARY KEY,
     state jsonb NOT NULL,
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS consents (
     seq bigserial PRIMARY KEY,
     contact_ref text NOT NULL,
     purpose text NOT NULL,
     granted boolean NOT NULL,
     text_version text NOT NULL,
     text_hash text NOT NULL,
     signed_at timestamptz NOT NULL,
     signer_role text NOT NULL,
     channel text NOT NULL,
     child_assent boolean,
     revoked_at timestamptz
   )`,
  `CREATE TABLE IF NOT EXISTS appointments (
     id uuid PRIMARY KEY,
     contact text NOT NULL,
     starts_at timestamptz NOT NULL,
     ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
     status text NOT NULL CHECK (${APPOINTMENT_STATUS_CHECK}),
     created_at timestamptz NOT NULL,
     updated_at timestamptz NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS appointments_contact_starts ON appointments (contact, starts_at)`,
  `CREATE TABLE IF NOT EXISTS reminder_jobs (
     id text PRIMARY KEY,
     appointment_id uuid NOT NULL REFERENCES appointments (id),
     kind text NOT NULL CHECK (kind IN ('early','day_before','no_reply_check')),
     due_at timestamptz NOT NULL,
     state text NOT NULL CHECK (state IN ('pending','sent','skipped'))
   )`,
  `CREATE INDEX IF NOT EXISTS reminder_jobs_pending_due ON reminder_jobs (due_at) WHERE state = 'pending'`,
  `CREATE INDEX IF NOT EXISTS processed_messages_at ON processed_messages (processed_at)`,
  `CREATE TABLE IF NOT EXISTS alerts (
     seq bigserial PRIMARY KEY,
     id uuid NOT NULL UNIQUE,
     contact text NOT NULL,
     appointment_id uuid REFERENCES appointments (id),
     reason text NOT NULL,
     at timestamptz NOT NULL,
     resolved boolean NOT NULL DEFAULT false
   )`,
];
