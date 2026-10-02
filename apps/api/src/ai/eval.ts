// eval.ts: scores an intent classifier against a labeled data set — accuracy, per-kind recall,
// preference accuracy, confusion pairs, latency and how often the model degraded.
import { z } from 'zod';
import {
  INTENT_KINDS,
  IntentSchema,
  type Intent,
  type IntentClassifierPort,
  type IntentKind,
} from '@audiorapy/domain';

export const EvalItemSchema = z.object({
  text: z.string().min(1).max(500),
  kind: z.enum(INTENT_KINDS),
  preference: IntentSchema.shape.preference,
});

export const EvalSetSchema = z.object({
  name: z.string(),
  synthetic: z.literal(true),
  note: z.string(),
  items: z.array(EvalItemSchema).min(1),
});

export type EvalItem = z.infer<typeof EvalItemSchema>;
export type EvalSet = z.infer<typeof EvalSetSchema>;

export interface Prediction {
  item: EvalItem;
  intent: Intent | null;
  ms: number;
  error: string | null;
}

export interface EvalReport {
  classifier: string;
  total: number;
  correct: number;
  accuracy: number;
  degraded: number;
  preferenceItems: number;
  preferenceCorrect: number;
  perKind: Record<IntentKind, { total: number; correct: number }>;
  confusions: Array<{ text: string; expected: IntentKind; got: IntentKind | 'degraded' }>;
  latencyMs: { p50: number; p95: number; max: number };
}

export async function predict(
  classifier: IntentClassifierPort,
  items: EvalItem[],
): Promise<Prediction[]> {
  const out: Prediction[] = [];
  for (const item of items) {
    const started = performance.now();
    const r = await classifier.classify(item.text);
    const ms = Math.round(performance.now() - started);
    out.push({
      item,
      intent: r.available ? r.data : null,
      ms,
      error: r.available ? null : r.error,
    });
  }
  return out;
}

function samePreference(expected: EvalItem['preference'], got: Intent['preference']): boolean {
  return (
    (expected?.weekday ?? null) === (got?.weekday ?? null) &&
    (expected?.partOfDay ?? null) === (got?.partOfDay ?? null)
  );
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]!;
}

export function score(classifier: string, predictions: Prediction[]): EvalReport {
  const perKind = Object.fromEntries(
    INTENT_KINDS.map((k) => [k, { total: 0, correct: 0 }]),
  ) as EvalReport['perKind'];
  const confusions: EvalReport['confusions'] = [];
  let correct = 0;
  let degraded = 0;
  let preferenceItems = 0;
  let preferenceCorrect = 0;

  for (const { item, intent } of predictions) {
    perKind[item.kind].total++;
    if (!intent) {
      degraded++;
      confusions.push({ text: item.text, expected: item.kind, got: 'degraded' });
      continue;
    }
    if (intent.kind === item.kind) {
      correct++;
      perKind[item.kind].correct++;
    } else {
      confusions.push({ text: item.text, expected: item.kind, got: intent.kind });
    }
    if (item.preference) {
      preferenceItems++;
      if (samePreference(item.preference, intent.preference)) preferenceCorrect++;
    }
  }

  const latencies = predictions.map((p) => p.ms).sort((a, b) => a - b);
  const total = predictions.length;
  return {
    classifier,
    total,
    correct,
    accuracy: total === 0 ? 0 : correct / total,
    degraded,
    preferenceItems,
    preferenceCorrect,
    perKind,
    confusions,
    latencyMs: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      max: latencies.at(-1) ?? 0,
    },
  };
}

const pct = (n: number, d: number) => (d === 0 ? '—' : `${Math.round((n / d) * 100)} %`);

export function toMarkdown(reports: EvalReport[], setName: string, date: string): string {
  const lines = [
    `### Intent eval · ${setName} · ${date}`,
    '',
    '| Classifier | Accuracy | Preference | Degraded | p50 | p95 |',
    '|---|---|---|---|---|---|',
    ...reports.map(
      (r) =>
        `| ${r.classifier} | ${r.correct}/${r.total} (${pct(r.correct, r.total)}) | ${r.preferenceCorrect}/${r.preferenceItems} | ${r.degraded} | ${r.latencyMs.p50} ms | ${r.latencyMs.p95} ms |`,
    ),
    '',
    '| Kind | ' + reports.map((r) => r.classifier).join(' | ') + ' |',
    '|---|' + reports.map(() => '---|').join(''),
    ...INTENT_KINDS.map(
      (k) =>
        `| ${k} | ` +
        reports.map((r) => `${r.perKind[k].correct}/${r.perKind[k].total}`).join(' | ') +
        ' |',
    ),
  ];
  for (const r of reports) {
    if (r.confusions.length === 0) continue;
    lines.push('', `Misses — ${r.classifier}:`, '');
    for (const c of r.confusions)
      lines.push(`- "${c.text}" → expected \`${c.expected}\`, got \`${c.got}\``);
  }
  return lines.join('\n') + '\n';
}

export interface EvalArgs {
  ollama: boolean;
  minAccuracy: number | null;
  out: string | null;
}

/** Flags for scripts/eval-intent.ts. Boolean flags are read before the value guard. */
export function parseEvalArgs(argv: string[], ollamaByDefault = false): EvalArgs {
  const args: EvalArgs = { ollama: ollamaByDefault, minAccuracy: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === '--ollama') args.ollama = true;
    if (value === undefined || value.startsWith('--')) continue;
    if (flag === '--min-accuracy') {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0 && n <= 1) args.minAccuracy = n;
    }
    if (flag === '--out') args.out = value;
  }
  return args;
}
