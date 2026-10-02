// risk.ts: no-show risk adapters — the local heuristic, the model sidecar (TabPFN-2 or its logistic
// baseline) and the fallback that answers with the heuristic whenever the sidecar is unavailable.
// The sidecar only ever receives numeric attendance features.
import { z } from 'zod';
import {
  degraded,
  guard,
  heuristicRisk,
  ok,
  type NoShowRiskPort,
  type PortResult,
  type Risk,
  type RiskFeatures,
} from '@audiorapy/domain';

export class HeuristicRiskAdapter implements NoShowRiskPort {
  readonly name = 'heuristic';
  async score(features: RiskFeatures): Promise<PortResult<Risk>> {
    return ok(this.name, heuristicRisk(features));
  }
}

const SidecarResponse = z.object({
  score: z.number().min(0).max(1),
  band: z.enum(['low', 'medium', 'high']),
  model: z.string().max(40),
});

const clampInt = (n: number | undefined, min: number, max: number, fallback: number) =>
  n === undefined || !Number.isFinite(n) ? fallback : Math.min(max, Math.max(min, Math.trunc(n)));

/** Maps domain features to the sidecar's request body (snake_case, bounded). */
export function sidecarBody(f: RiskFeatures) {
  const priorVisits = clampInt(f.priorVisits, 0, 500, 0);
  return {
    lead_days: Math.min(120, Math.max(0, Number.isFinite(f.leadTimeDays) ? f.leadTimeDays : 0)),
    weekday: clampInt(f.weekday, 0, 6, 0),
    hour: clampInt(f.hour, 0, 23, 9),
    zone: 0,
    session_number: clampInt(f.sessionNumber, 1, 500, Math.min(500, priorVisits + 1)),
    prior_visits: priorVisits,
    prior_no_shows: clampInt(f.priorNoShows, 0, priorVisits, 0),
    replied_last_reminder: f.repliedToLastReminder === null ? -1 : f.repliedToLastReminder ? 1 : 0,
  };
}

export interface SidecarOptions {
  baseUrl: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

export class SidecarRiskAdapter implements NoShowRiskPort {
  readonly name = 'sidecar';
  constructor(private readonly opts: SidecarOptions) {}

  async score(features: RiskFeatures): Promise<PortResult<Risk>> {
    const doFetch = this.opts.fetchImpl ?? fetch;
    const r = await guard(
      this.name,
      async (signal) => {
        const res = await doFetch(`${this.opts.baseUrl.replace(/\/$/, '')}/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sidecarBody(features)),
          signal,
        });
        if (!res.ok) throw new Error(`risk sidecar responded ${res.status}`);
        const parsed = SidecarResponse.safeParse(await res.json());
        if (!parsed.success) throw new Error('risk sidecar response failed validation');
        return { score: parsed.data.score, band: parsed.data.band, model: parsed.data.model };
      },
      this.opts.timeoutMs,
    );
    if (!r.available) return degraded(this.name, r.error);
    return {
      ...r,
      source: `sidecar:${r.data.model}`,
      data: { score: r.data.score, band: r.data.band },
    };
  }
}

/** Tries the sidecar; on any degraded result answers with the heuristic and remembers why. */
export class FallbackRisk {
  private readonly heuristic = new HeuristicRiskAdapter();
  lastPrimary: PortResult<Risk> | null = null;

  constructor(readonly primary: NoShowRiskPort | null) {}

  async score(features: RiskFeatures): Promise<{ risk: Risk; source: string }> {
    if (this.primary) {
      const r = await this.primary.score(features);
      this.lastPrimary = r;
      if (r.available) return { risk: r.data, source: r.source };
    }
    const h = await this.heuristic.score(features);
    return { risk: h.data!, source: this.heuristic.name };
  }
}
