// risk-consent.spec.ts: heuristic no-show bands and consent resolution over time.
import { describe, expect, it } from 'vitest';
import { allows, hashConsentText, heuristicRisk, recordConsent } from '@audiorapy/domain';

describe('heuristicRisk', () => {
  it('a reliable family is low risk', () => {
    expect(
      heuristicRisk({
        priorVisits: 20,
        priorNoShows: 0,
        leadTimeDays: 2,
        repliedToLastReminder: true,
      }).band,
    ).toBe('low');
  });

  it('frequent no-shows and silence are high risk', () => {
    expect(
      heuristicRisk({
        priorVisits: 6,
        priorNoShows: 4,
        leadTimeDays: 20,
        repliedToLastReminder: false,
      }).band,
    ).toBe('high');
  });

  it('treats garbage numbers as zero', () => {
    expect(
      heuristicRisk({
        priorVisits: NaN,
        priorNoShows: -3,
        leadTimeDays: Infinity,
        repliedToLastReminder: null,
      }).score,
    ).toBeGreaterThanOrEqual(0);
  });
});

describe('consent', () => {
  const base = {
    contactRef: 'c1',
    purpose: 'whatsapp_scheduling' as const,
    textVersion: 'v1',
    text: 'Texto v1',
    channel: 'whatsapp_button' as const,
    childAssent: null,
  };

  it('hashes the exact text shown', () => {
    expect(
      recordConsent({ ...base, granted: true, signedAt: '2026-10-02T10:00:00Z' }).textHash,
    ).toBe(hashConsentText('Texto v1'));
  });

  it('the latest decision wins', () => {
    const records = [
      recordConsent({ ...base, granted: true, signedAt: '2026-10-02T10:00:00Z' }),
      recordConsent({ ...base, granted: false, signedAt: '2026-10-03T10:00:00Z' }),
    ];
    expect(allows(records, 'c1', 'whatsapp_scheduling', new Date('2026-10-02T12:00:00Z'))).toBe(
      true,
    );
    expect(allows(records, 'c1', 'whatsapp_scheduling', new Date('2026-10-04T12:00:00Z'))).toBe(
      false,
    );
    expect(allows(records, 'c1', 'ai_processing', new Date('2026-10-02T12:00:00Z'))).toBe(false);
  });

  it('a revoked grant stops allowing from the revocation on', () => {
    const r = {
      ...recordConsent({ ...base, granted: true, signedAt: '2026-10-02T10:00:00Z' }),
      revokedAt: '2026-10-05T00:00:00Z',
    };
    expect(allows([r], 'c1', 'whatsapp_scheduling', new Date('2026-10-04T00:00:00Z'))).toBe(true);
    expect(allows([r], 'c1', 'whatsapp_scheduling', new Date('2026-10-06T00:00:00Z'))).toBe(false);
  });
});
