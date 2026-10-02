// risk.spec.ts: the risk sidecar adapter against a fake sidecar, and the heuristic fallback around it.
import { describe, expect, it } from 'vitest';
import { FallbackRisk, SidecarRiskAdapter, sidecarBody } from '../../../apps/api/src/ai/risk.ts';
import { fakeFetch } from '../../api-helpers.ts';

const features = {
  priorVisits: 4,
  priorNoShows: 1,
  leadTimeDays: 3.5,
  repliedToLastReminder: true,
  weekday: 2,
  hour: 9,
  sessionNumber: 5,
};

describe('sidecarBody', () => {
  it('maps to the sidecar fields with unknowns made explicit', () => {
    expect(sidecarBody(features)).toEqual({
      lead_days: 3.5,
      weekday: 2,
      hour: 9,
      zone: 0,
      session_number: 5,
      prior_visits: 4,
      prior_no_shows: 1,
      replied_last_reminder: 1,
    });
    expect(
      sidecarBody({ priorVisits: 0, priorNoShows: 0, leadTimeDays: 1, repliedToLastReminder: null })
        .replied_last_reminder,
    ).toBe(-1);
  });

  it('never claims more no-shows than visits', () => {
    expect(sidecarBody({ ...features, priorVisits: 2, priorNoShows: 9 }).prior_no_shows).toBe(2);
  });
});

describe('SidecarRiskAdapter', () => {
  it('posts the features and returns the validated score', async () => {
    let sent: unknown = null;
    const a = new SidecarRiskAdapter({
      baseUrl: 'http://risk.test/',
      timeoutMs: 1000,
      fetchImpl: fakeFetch((url, init) => {
        expect(url).toBe('http://risk.test/score');
        sent = JSON.parse(String(init.body));
        return Response.json({ score: 0.52, band: 'high', model: 'tabpfn-v2' });
      }),
    });
    expect(await a.score(features)).toMatchObject({
      available: true,
      source: 'sidecar:tabpfn-v2',
      data: { score: 0.52, band: 'high' },
    });
    expect(Object.keys(sent as object).sort()).toEqual([
      'hour',
      'lead_days',
      'prior_no_shows',
      'prior_visits',
      'replied_last_reminder',
      'session_number',
      'weekday',
      'zone',
    ]);
  });

  it('degrades on errors, timeouts and invalid responses', async () => {
    const make = (h: () => Response | Promise<Response>, timeoutMs = 1000) =>
      new SidecarRiskAdapter({ baseUrl: 'http://risk.test', timeoutMs, fetchImpl: fakeFetch(h) });
    expect(await make(() => new Response('', { status: 500 })).score(features)).toMatchObject({
      available: false,
      error: 'risk sidecar responded 500',
    });
    expect(
      await make(() => Response.json({ score: 7, band: 'high', model: 'x' })).score(features),
    ).toMatchObject({ available: false, error: 'risk sidecar response failed validation' });
    expect(
      await make(() => Promise.reject(new TypeError('fetch failed'))).score(features),
    ).toMatchObject({ available: false });
    expect(await make(() => new Promise<Response>(() => {}), 20).score(features)).toMatchObject({
      available: false,
      error: 'timeout after 20ms',
    });
  });
});

describe('FallbackRisk', () => {
  it('uses the heuristic when the sidecar is down and remembers why', async () => {
    const down = new SidecarRiskAdapter({
      baseUrl: 'http://risk.test',
      timeoutMs: 100,
      fetchImpl: fakeFetch(() => Promise.reject(new Error('ECONNREFUSED'))),
    });
    const r = new FallbackRisk(down);
    const out = await r.score(features);
    expect(out.source).toBe('heuristic');
    expect(['low', 'medium', 'high']).toContain(out.risk.band);
    expect(r.lastPrimary).toMatchObject({ available: false, error: 'ECONNREFUSED' });
  });

  it('without a sidecar it is the heuristic', async () => {
    expect((await new FallbackRisk(null).score(features)).source).toBe('heuristic');
  });
});
