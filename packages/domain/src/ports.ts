// ports.ts: interfaces the infrastructure implements. Zero third-party imports.
import type { Intent } from './intent.ts';
import type { Outbound } from './messages.ts';
import type { PortResult } from './port-result.ts';
import type { Risk, RiskFeatures } from './risk.ts';

export interface IntentClassifierPort {
  readonly name: string;
  classify(text: string): Promise<PortResult<Intent>>;
}

export interface NoShowRiskPort {
  readonly name: string;
  score(features: RiskFeatures): Promise<PortResult<Risk>>;
}

/** A recipient is a phone in E.164 or a business-scoped user id; the channel decides how to address it. */
export interface ChannelPort {
  readonly name: string;
  send(
    recipient: string,
    message: Outbound,
    idempotencyKey: string,
  ): Promise<PortResult<{ id: string }>>;
}
