// rules-intent.ts: the deterministic classifier as a port, and the fallback wrapper around any model.
import {
  classifyByRules,
  ok,
  type Intent,
  type IntentClassifierPort,
  type PortResult,
} from '@audiorapy/domain';

export class RulesIntentClassifier implements IntentClassifierPort {
  readonly name = 'rules';
  async classify(text: string): Promise<PortResult<Intent>> {
    return ok(this.name, classifyByRules(text));
  }
}

export interface ClassifiedIntent {
  intent: Intent;
  source: string;
  fallbackReason?: string;
}

/** Tries the primary classifier; on any degraded result answers with the rules and says so. */
export class FallbackIntentClassifier {
  private readonly rules = new RulesIntentClassifier();
  lastPrimary: PortResult<Intent> | null = null;

  constructor(readonly primary: IntentClassifierPort | null) {}

  async classify(text: string): Promise<ClassifiedIntent> {
    if (this.primary) {
      const r = await this.primary.classify(text);
      this.lastPrimary = r;
      if (r.available) return { intent: r.data, source: r.source };
      const fallback = await this.rules.classify(text);
      return { intent: fallback.data!, source: this.rules.name, fallbackReason: r.error };
    }
    const r = await this.rules.classify(text);
    return { intent: r.data!, source: this.rules.name };
  }
}
