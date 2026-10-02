// pg-helpers.ts: Postgres-backed stores for tests — PGlite (real Postgres engine, in process) and a
// real server from DATABASE_URL. Each opened store starts from empty tables.
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { PostgresStore, type SqlClient } from '../apps/api/src/store/postgres-store.ts';

const TABLES = 'alerts, reminder_jobs, appointments, consents, conversations, processed_messages';

export async function openPglite() {
  const db = new PGlite();
  const store = await PostgresStore.open(db as unknown as SqlClient);
  return {
    store,
    db,
    truncate: () => db.query(`TRUNCATE ${TABLES} RESTART IDENTITY CASCADE`),
    done: () => db.close(),
  };
}

export async function openRealPostgres(url: string) {
  const pool = new pg.Pool({ connectionString: url, max: 10 });
  const store = await PostgresStore.open(pool);
  await pool.query(`TRUNCATE ${TABLES} RESTART IDENTITY CASCADE`);
  return { store, done: () => pool.end() };
}
