// ollama.spec.ts: the Gemma/Ollama classifier against a fake Ollama — schema-forced output, validation,
// circuit breaker — and the rules fallback around it.
import { describe, expect, it } from 'vitest';
import { OllamaIntentClassifier } from '../../../apps/api/src/ai/ollama-intent.ts';
import { FallbackIntentClassifier } from '../../../apps/api/src/ai/rules-intent.ts';
import { fakeFetch } from '../../api-helpers.ts';

const reply = (content: unknown) =>
  Response.json({
    message: {
      role: 'assistant',
      content: typeof content === 'string' ? content : JSON.stringify(content),
    },
  });
const base = { baseUrl: 'http://ollama.test', model: 'gemma4:e4b', timeoutMs: 1000 };

describe('OllamaIntentClassifier', () => {
  it('sends the text with a JSON Schema format and returns the validated intent', async () => {
    let body: Record<string, unknown> = {};
    const c = new OllamaIntentClassifier({
      ...base,
      fetchImpl: fakeFetch((url, init) => {
        expect(url).toBe('http://ollama.test/api/chat');
        body = JSON.parse(String(init.body));
        return reply({ kind: 'reschedule', preference: { weekday: 3 } });
      }),
    });
    expect(await c.classify('mejor el miércoles')).toMatchObject({
      available: true,
      source: 'ollama:gemma4:e4b',
      data: { kind: 'reschedule', preference: { weekday: 3 } },
    });
    expect(body).toMatchObject({ model: 'gemma4:e4b', stream: false, options: { temperature: 0 } });
    expect((body.format as { type: string }).type).toBe('object');
    const messages = body.messages as Array<{ role: string; content: string }>;
    expect(messages[1]).toEqual({ role: 'user', content: 'mejor el miércoles' });
  });

  it('rejects output that does not match the schema', async () => {
    const c = new OllamaIntentClassifier({
      ...base,
      fetchImpl: fakeFetch(() => reply({ kind: 'book_and_pay' })),
    });
    expect(await c.classify('x')).toMatchObject({
      available: false,
      error: 'model output failed schema validation',
    });
  });

  it('rejects non-JSON content', async () => {
    const c = new OllamaIntentClassifier({
      ...base,
      fetchImpl: fakeFetch(() => reply('claro que sí')),
    });
    expect((await c.classify('x')).available).toBe(false);
  });

  it('opens the circuit after repeated failures and stops calling', async () => {
    let calls = 0;
    const c = new OllamaIntentClassifier({
      ...base,
      breakerThreshold: 2,
      breakerCooldownMs: 60_000,
      fetchImpl: fakeFetch(() => (calls++, Promise.reject(new Error('ECONNREFUSED')))),
    });
    await c.classify('a');
    await c.classify('b');
    expect(await c.classify('c')).toMatchObject({ available: false, error: 'circuit open' });
    expect(calls).toBe(2);
  });
});

describe('FallbackIntentClassifier', () => {
  it('answers with the rules when the model is down, and reports why', async () => {
    const down = new OllamaIntentClassifier({
      ...base,
      fetchImpl: fakeFetch(() => Promise.reject(new Error('ECONNREFUSED'))),
    });
    const c = new FallbackIntentClassifier(down);
    expect(await c.classify('quiero cancelar')).toEqual({
      intent: { kind: 'cancel' },
      source: 'rules',
      fallbackReason: 'ECONNREFUSED',
    });
    expect(c.lastPrimary).toMatchObject({ available: false, source: 'ollama:gemma4:e4b' });
  });

  it('uses the model when it answers', async () => {
    const up = new OllamaIntentClassifier({
      ...base,
      fetchImpl: fakeFetch(() => reply({ kind: 'affirm' })),
    });
    expect(await new FallbackIntentClassifier(up).classify('de una')).toEqual({
      intent: { kind: 'affirm' },
      source: 'ollama:gemma4:e4b',
    });
  });
});
