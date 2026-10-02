// config.spec.ts: environment parsing — defaults, the channel switch and RISK_URL normalization.
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../../apps/api/src/config.ts';

describe('loadConfig', () => {
  it('runs with no environment at all', () => {
    const c = loadConfig({});
    expect(c).toMatchObject({
      channel: 'console',
      AI_INTENT_PROVIDER: 'rules',
      RISK_PROVIDER: 'heuristic',
      RISK_URL: 'http://127.0.0.1:8090',
    });
  });

  it('accepts a bare host:port for RISK_URL (Render private network) and keeps full URLs', () => {
    expect(loadConfig({ RISK_URL: 'audiorapy-risk:10000' }).RISK_URL).toBe(
      'http://audiorapy-risk:10000',
    );
    expect(loadConfig({ RISK_URL: ' https://risk.example.org ' }).RISK_URL).toBe(
      'https://risk.example.org',
    );
  });

  it('rejects a RISK_URL that is not a URL even after adding the scheme', () => {
    expect(() => loadConfig({ RISK_URL: 'not a host' })).toThrow();
  });

  it('switches to the Meta channel only with both token and phone id', () => {
    expect(loadConfig({ META_ACCESS_TOKEN: 't' }).channel).toBe('console');
    expect(loadConfig({ META_ACCESS_TOKEN: 't', META_PHONE_NUMBER_ID: '1' }).channel).toBe('meta');
  });
});
