// postgres.integration.spec.ts: the store contract against a real Postgres server (DATABASE_URL).
// This project exists to exercise the real thing, so it fails when no server is configured.
import { describe, expect, it } from 'vitest';
import { storeContract } from '../store-contract.ts';
import { openRealPostgres } from '../pg-helpers.ts';

const url = process.env.DATABASE_URL;

describe('integration setup', () => {
  it('DATABASE_URL points at a Postgres server', () => {
    expect(url, 'set DATABASE_URL to run the Postgres integration tests').toMatch(
      /^postgres(ql)?:\/\//,
    );
  });
});

if (url) storeContract('postgres (real server)', () => openRealPostgres(url));
