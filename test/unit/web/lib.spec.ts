// lib.spec.ts: dashboard logic — vault file parsing, synthetic data, progress series, local-only AI.
import { describe, expect, it } from 'vitest';
import { createVault, verifyChain } from '@audiorapy/domain';
import { draftSoap, isLoopback } from '../../../apps/web/src/lib/ai.ts';
import { fetchAgenda } from '../../../apps/web/src/lib/agenda.ts';
import { progressSeries } from '../../../apps/web/src/lib/progress.ts';
import {
  appendRecord,
  byKind,
  decryptLog,
  syntheticRecords,
} from '../../../apps/web/src/lib/records.ts';
import {
  loadVault,
  newVaultFile,
  parseVaultFile,
  saveVault,
} from '../../../apps/web/src/lib/storage.ts';
import { fakeFetch } from '../../api-helpers.ts';
import { FAST_KDF } from '../../helpers.ts';

const today = new Date('2026-10-02T12:00:00Z');

describe('records', () => {
  it('synthetic data is deterministic and labeled synthetic', () => {
    const a = syntheticRecords(today);
    expect(syntheticRecords(today)).toEqual(a);
    const patients = byKind(a, 'patient');
    expect(patients).toHaveLength(1);
    expect(patients[0]).toMatchObject({ synthetic: true, alias: 'Paciente sintético A' });
    expect(byKind(a, 'session')).toHaveLength(8);
  });

  it('appends encrypted, chained records and decrypts them back', () => {
    const v = createVault('frase de prueba larga', FAST_KDF);
    let log = newVaultFile(v.header).log;
    for (const r of syntheticRecords(today)) log = appendRecord(v.dek, log, r);
    expect(verifyChain(log)).toBe(-1);
    expect(decryptLog(v.dek, log)).toEqual({ records: syntheticRecords(today), failed: 0 });
    expect(decryptLog(new Uint8Array(32), log).failed).toBe(log.length);
  });
});

describe('storage', () => {
  it('round-trips through a storage object and rejects foreign files', () => {
    const v = createVault('frase de prueba larga', FAST_KDF);
    const mem = new Map<string, string>();
    const storage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, val: string) => void mem.set(k, val),
    };
    expect(saveVault(newVaultFile(v.header), storage)).toBe(true);
    expect(loadVault(storage)?.header.fingerprint).toBe(v.header.fingerprint);
    expect(parseVaultFile({ format: 'other' })).toBeNull();
  });

  it('survives a storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(loadVault(broken)).toBeNull();
    expect(
      saveVault(newVaultFile(createVault('frase de prueba larga', FAST_KDF).header), broken),
    ).toBe(false);
  });
});

describe('progress', () => {
  it('builds one ordered series per target with the criterion', () => {
    const recs = syntheticRecords(today);
    const series = progressSeries(byKind(recs, 'patient')[0]!, byKind(recs, 'session'));
    expect(series.map((s) => s.label)).toEqual([
      '/s/ inicial en palabras',
      '/r/ simple en sílabas',
      'Frases de 3 elementos',
    ]);
    expect(series[0]!.points).toHaveLength(8);
    expect(series[0]!.criterionPercent).toBe(80);
    const dates = series[0]!.points.map((p) => p.date);
    expect([...dates].sort()).toEqual(dates);
  });
});

describe('local AI', () => {
  it('only loopback hosts count as local', () => {
    expect(isLoopback('http://127.0.0.1:11434')).toBe(true);
    expect(isLoopback('http://localhost:11434')).toBe(true);
    expect(isLoopback('https://ollama.example.com')).toBe(false);
    expect(isLoopback('http://127.0.0.1.evil.com')).toBe(false);
    expect(isLoopback('not a url')).toBe(false);
  });

  it('refuses a remote model without calling it', async () => {
    let called = false;
    const r = await draftSoap(
      [],
      '',
      { baseUrl: 'https://api.example.com', model: 'x', timeoutMs: 100 },
      fakeFetch(() => ((called = true), Response.json({}))),
    );
    expect(called).toBe(false);
    expect(r).toMatchObject({ aiAvailable: false, error: 'solo se permite Ollama local' });
  });

  it('falls back to the template when Ollama is down', async () => {
    const r = await draftSoap(
      [],
      '',
      { baseUrl: 'http://127.0.0.1:11434', model: 'm', timeoutMs: 100 },
      fakeFetch(() => Promise.reject(new TypeError('Failed to fetch'))),
    );
    expect(r).toMatchObject({
      aiAvailable: false,
      error: 'Failed to fetch',
      note: { source: 'template' },
    });
  });
});

describe('agenda', () => {
  it('degrades without configuration, on 401 and on network errors', async () => {
    expect(await fetchAgenda({ baseUrl: '', token: '' })).toMatchObject({
      available: false,
      error: 'API no configurada',
    });
    expect(
      await fetchAgenda(
        { baseUrl: 'http://api', token: 't' },
        fakeFetch(() => new Response('', { status: 401 })),
      ),
    ).toMatchObject({ available: false, error: 'token rechazado' });
    expect(
      await fetchAgenda(
        { baseUrl: 'http://api', token: 't' },
        fakeFetch(() => Promise.reject(new TypeError('Failed to fetch'))),
      ),
    ).toMatchObject({ available: false });
  });
});
