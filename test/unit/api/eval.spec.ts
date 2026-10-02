// eval.spec.ts: the intent eval — data set shape, scoring, report and CLI flags.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  INTENT_KINDS,
  ok,
  degraded,
  type Intent,
  type IntentClassifierPort,
} from '@audiorapy/domain';
import {
  EvalSetSchema,
  parseEvalArgs,
  predict,
  score,
  toMarkdown,
} from '../../../apps/api/src/ai/eval.ts';

const set = EvalSetSchema.parse(
  JSON.parse(readFileSync(new URL('../../../eval/intents.es-CO.json', import.meta.url), 'utf8')),
);

const fixed = (answer: Intent | null): IntentClassifierPort => ({
  name: 'fixed',
  classify: async () => (answer ? ok('fixed', answer) : degraded('fixed', 'ECONNREFUSED')),
});

describe('eval data set', () => {
  it('has at least 40 synthetic items covering every intent kind, with no duplicates', () => {
    expect(set.synthetic).toBe(true);
    expect(set.items.length).toBeGreaterThanOrEqual(40);
    for (const k of INTENT_KINDS)
      expect(
        set.items.some((i) => i.kind === k),
        k,
      ).toBe(true);
    expect(new Set(set.items.map((i) => i.text)).size).toBe(set.items.length);
  });
});

describe('score', () => {
  const items = [
    { text: 'Hola', kind: 'greeting' as const },
    { text: 'mejor el lunes', kind: 'reschedule' as const, preference: { weekday: 1 } },
  ];

  it('counts accuracy, per-kind recall, preference and confusions', async () => {
    const r = score(
      'fixed',
      await predict(fixed({ kind: 'reschedule', preference: { weekday: 1 } }), items),
    );
    expect(r).toMatchObject({
      total: 2,
      correct: 1,
      accuracy: 0.5,
      degraded: 0,
      preferenceItems: 1,
      preferenceCorrect: 1,
    });
    expect(r.perKind.greeting).toEqual({ total: 1, correct: 0 });
    expect(r.confusions).toEqual([{ text: 'Hola', expected: 'greeting', got: 'reschedule' }]);
  });

  it('a degraded classifier scores zero and says so', async () => {
    const r = score('down', await predict(fixed(null), items));
    expect(r).toMatchObject({ correct: 0, degraded: 2 });
    expect(r.confusions.every((c) => c.got === 'degraded')).toBe(true);
  });

  it('a preference with the wrong weekday is not counted', async () => {
    const r = score(
      'x',
      await predict(fixed({ kind: 'reschedule', preference: { weekday: 2 } }), [items[1]!]),
    );
    expect(r.preferenceCorrect).toBe(0);
  });

  it('renders a Markdown report with every kind and the misses', async () => {
    const md = toMarkdown(
      [score('rules', await predict(fixed({ kind: 'greeting' }), items))],
      'tiny',
      '2026-10-02',
    );
    expect(md).toContain('| rules | 1/2 (50 %) | 0/1 | 0 |');
    for (const k of INTENT_KINDS) expect(md).toContain(`| ${k} |`);
    expect(md).toContain('"mejor el lunes" → expected `reschedule`, got `greeting`');
  });
});

describe('parseEvalArgs', () => {
  it('reads flags and rejects out-of-range accuracy', () => {
    expect(parseEvalArgs(['--ollama', '--min-accuracy', '0.9', '--out', 'r.json'])).toEqual({
      ollama: true,
      minAccuracy: 0.9,
      out: 'r.json',
    });
    expect(parseEvalArgs(['--min-accuracy', '7'])).toMatchObject({ minAccuracy: null });
    expect(parseEvalArgs(['--min-accuracy', '--ollama'])).toMatchObject({
      minAccuracy: null,
      ollama: true,
    });
    expect(parseEvalArgs([], true).ollama).toBe(true);
  });
});
