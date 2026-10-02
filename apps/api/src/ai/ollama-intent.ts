// ollama-intent.ts: Gemma 4 on Ollama as intent classifier, output forced to the intent JSON Schema.
// Sees only the caregiver's message text. Any failure is a degraded result, never a throw.
import { z } from 'zod';
import {
  degraded,
  guard,
  IntentSchema,
  MAX_INTENT_TEXT,
  parseIntent,
  type Intent,
  type IntentClassifierPort,
  type PortResult,
} from '@audiorapy/domain';

export const INTENT_SYSTEM_PROMPT =
  'Clasifica el mensaje de WhatsApp de un cuidador que agenda visitas de fonoaudiología a domicilio en Colombia. ' +
  'kind: greeting (saludo), affirm (sí, confirma), deny (no), cancel (quiere cancelar), reschedule (quiere otro día u hora), ' +
  'question (pregunta), unknown (otra cosa). Si menciona día de la semana (0=domingo..6=sábado) o franja ' +
  '(morning, afternoon, evening), inclúyelo en preference. Responde solo JSON.';

const intentJsonSchema = z.toJSONSchema(IntentSchema);

export interface OllamaOptions {
  baseUrl: string;
  model: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
  /** Consecutive failures before the breaker opens, and how long it stays open. */
  breakerThreshold?: number;
  breakerCooldownMs?: number;
}

export class OllamaIntentClassifier implements IntentClassifierPort {
  readonly name: string;
  private failures = 0;
  private openUntil = 0;

  constructor(private readonly opts: OllamaOptions) {
    this.name = `ollama:${opts.model}`;
  }

  async classify(text: string): Promise<PortResult<Intent>> {
    if (Date.now() < this.openUntil) return degraded(this.name, 'circuit open');
    const doFetch = this.opts.fetchImpl ?? fetch;
    const r = await guard(
      this.name,
      async (signal) => {
        const res = await doFetch(`${this.opts.baseUrl.replace(/\/$/, '')}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            model: this.opts.model,
            stream: false,
            format: intentJsonSchema,
            options: { temperature: 0 },
            messages: [
              { role: 'system', content: INTENT_SYSTEM_PROMPT },
              { role: 'user', content: text.slice(0, MAX_INTENT_TEXT) },
            ],
          }),
        });
        if (!res.ok) throw new Error(`ollama responded ${res.status}`);
        const json = (await res.json()) as { message?: { content?: unknown } };
        const content = json.message?.content;
        if (typeof content !== 'string') throw new Error('ollama response without content');
        const intent = parseIntent(JSON.parse(content));
        if (!intent) throw new Error('model output failed schema validation');
        return intent;
      },
      this.opts.timeoutMs,
    );
    this.track(r.available);
    return r;
  }

  private track(success: boolean) {
    if (success) {
      this.failures = 0;
      return;
    }
    this.failures++;
    if (this.failures >= (this.opts.breakerThreshold ?? 3)) {
      this.openUntil = Date.now() + (this.opts.breakerCooldownMs ?? 60_000);
      this.failures = 0;
    }
  }
}
