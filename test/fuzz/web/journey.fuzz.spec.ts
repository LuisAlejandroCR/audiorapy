// journey.fuzz.spec.ts: browser storage and typed text are untrusted — stored route flags, the address
// book, quiz answers, addresses and stored dates can be anything, and none may crash the dashboard.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { parseFlags, quizMatches, quizPositions } from '../../../apps/web/src/lib/journey.ts';
import {
  cleanAddress,
  MAP_APPS,
  mapLink,
  MAX_ADDRESS,
  parseBook,
} from '../../../apps/web/src/lib/maps.ts';
import { formatDayEs, formatStampEs, liveStats } from '../../../apps/web/src/lib/stats.ts';

const jsonish = fc.oneof(
  fc.string(),
  fc.json(),
  fc.anything().map((v) => {
    try {
      return JSON.stringify(v) ?? 'null';
    } catch {
      return 'null';
    }
  }),
);

describe('dashboard journey (fuzz)', () => {
  it('parseFlags never throws and only returns the two known fields with the right types', () => {
    fc.assert(
      fc.property(fc.option(jsonish, { nil: null }), fc.string(), (raw, fp) => {
        const f = parseFlags(raw, fp);
        for (const k of Object.keys(f)) expect(['recoveryVerified', 'backupAt']).toContain(k);
        if ('recoveryVerified' in f) expect(typeof f.recoveryVerified).toBe('boolean');
        if ('backupAt' in f) expect(typeof f.backupAt).toBe('string');
      }),
      { numRuns: 2000 },
    );
  });

  it('parseBook never throws, never pollutes the prototype, and keeps only string addresses', () => {
    fc.assert(
      fc.property(fc.option(jsonish, { nil: null }), (raw) => {
        const b = parseBook(raw);
        expect(Object.getPrototypeOf(b)).toBe(Object.prototype);
        for (const v of Object.values(b)) expect(typeof v).toBe('string');
      }),
      { numRuns: 2000 },
    );
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('any typed address yields either no link or an https link to one of the three map hosts', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 400 }), fc.constantFrom(...MAP_APPS), (addr, app) => {
        const link = mapLink(app.id, addr);
        if (link === null) {
          expect(cleanAddress(addr)).toBe('');
          return;
        }
        const u = new URL(link);
        expect(u.protocol).toBe('https:');
        expect(u.hostname).toBe(app.host);
        expect(cleanAddress(addr).length).toBeLessThanOrEqual(MAX_ADDRESS);
      }),
      { numRuns: 2000 },
    );
  });

  it('quiz answers and positions never throw on arbitrary input', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        fc.double(),
        fc.double(),
        fc.double(),
        (a, b, len, k, r) => {
          expect(typeof quizMatches(a, b)).toBe('boolean');
          const p = quizPositions(len, k, () => r);
          expect(Array.isArray(p)).toBe(true);
        },
      ),
      { numRuns: 2000 },
    );
  });

  it('stored dates in any shape format without throwing', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(typeof formatDayEs(s)).toBe('string');
        expect(typeof formatStampEs(s)).toBe('string');
      }),
      { numRuns: 2000 },
    );
  });

  it('live stats stay in range for any outcomes, criterion and goal', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { maxLength: 200 }),
        fc.double({ noNaN: true }),
        fc.double({ noNaN: true }),
        (outcomes, criterion, goal) => {
          const s = liveStats(outcomes, criterion, goal);
          expect(s.goal).toBeGreaterThanOrEqual(0);
          expect(s.goal).toBeLessThanOrEqual(1);
          expect(s.percent).toBeGreaterThanOrEqual(0);
          expect(s.percent).toBeLessThanOrEqual(100);
        },
      ),
      { numRuns: 2000 },
    );
  });
});
