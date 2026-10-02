// eval-intent.ts: runs the intent mini-eval. Always scores the rules; scores Gemma on Ollama too with
// --ollama (or AI_INTENT_PROVIDER=ollama). Prints a Markdown report; --min-accuracy gates the rules.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { OllamaIntentClassifier } from '../apps/api/src/ai/ollama-intent.ts';
import { RulesIntentClassifier } from '../apps/api/src/ai/rules-intent.ts';
import {
  EvalSetSchema,
  parseEvalArgs,
  predict,
  score,
  toMarkdown,
  type EvalReport,
} from '../apps/api/src/ai/eval.ts';

const args = parseEvalArgs(process.argv.slice(2), process.env.AI_INTENT_PROVIDER === 'ollama');
const setPath = fileURLToPath(new URL('../eval/intents.es-CO.json', import.meta.url));
const set = EvalSetSchema.parse(JSON.parse(readFileSync(setPath, 'utf8')));

const reports: EvalReport[] = [];
const rules = new RulesIntentClassifier();
reports.push(score(rules.name, await predict(rules, set.items)));

if (args.ollama) {
  const model = new OllamaIntentClassifier({
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL ?? 'gemma4:e4b',
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 60_000),
    breakerThreshold: Number.MAX_SAFE_INTEGER,
  });
  reports.push(score(model.name, await predict(model, set.items)));
}

const markdown = toMarkdown(reports, set.name, new Date().toISOString().slice(0, 10));
process.stdout.write(markdown);
if (args.out) writeFileSync(args.out, JSON.stringify(reports, null, 2));

const rulesReport = reports[0]!;
if (args.minAccuracy !== null && rulesReport.accuracy < args.minAccuracy) {
  process.stderr.write(
    `rules accuracy ${rulesReport.accuracy.toFixed(3)} is below --min-accuracy ${args.minAccuracy}\n`,
  );
  process.exit(1);
}
const modelReport = reports[1];
if (modelReport && modelReport.degraded === modelReport.total) {
  process.stderr.write(
    `every Ollama call degraded; is Ollama running with ${process.env.OLLAMA_MODEL ?? 'gemma4:e4b'}?\n`,
  );
  process.exit(2);
}
