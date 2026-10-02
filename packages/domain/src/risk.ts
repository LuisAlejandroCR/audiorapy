// risk.ts: heuristic no-show risk, the deterministic fallback for the TabPFN adapter.
// Its only consumer is reminder cadence, a low-stakes action.

export type RiskBand = 'low' | 'medium' | 'high';

export interface RiskFeatures {
  priorVisits: number;
  priorNoShows: number;
  leadTimeDays: number;
  repliedToLastReminder: boolean | null;
}

export interface Risk {
  score: number;
  band: RiskBand;
}

export function heuristicRisk(f: RiskFeatures): Risk {
  const visits = nonNegative(f.priorVisits);
  const noShows = Math.min(nonNegative(f.priorNoShows), visits);
  const lead = nonNegative(f.leadTimeDays);

  const history = (noShows + 1) / (visits + 5);
  const leadTerm = Math.min(lead, 30) / 30;
  const silence = f.repliedToLastReminder === false ? 1 : 0;
  const raw = 0.6 * history + 0.25 * leadTerm + 0.15 * silence;
  const score = Math.round(Math.min(1, Math.max(0, raw)) * 1000) / 1000;
  return { score, band: score >= 0.45 ? 'high' : score >= 0.25 ? 'medium' : 'low' };
}

function nonNegative(n: number): number {
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
