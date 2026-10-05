// providers.ts: picks each adapter from configuration. A missing key selects the local fallback.
import type { ChannelPort } from '@audiorapy/domain';
import type { Config } from './config.ts';
import { OllamaIntentClassifier } from './ai/ollama-intent.ts';
import { FallbackIntentClassifier } from './ai/rules-intent.ts';
import { ConsoleChannel } from './channel/console-channel.ts';
import { MetaChannel } from './channel/meta-channel.ts';
import { TelegramChannel } from './channel/telegram.ts';
import { FallbackRisk, SidecarRiskAdapter } from './ai/risk.ts';
import { MemoryStore } from './store/memory-store.ts';
import { PostgresStore } from './store/postgres-store.ts';
import type { SchedulingStore } from './store/store.ts';

export function buildChannel(config: Config): ChannelPort {
  if (config.channel === 'meta') {
    return new MetaChannel({
      accessToken: config.META_ACCESS_TOKEN!,
      phoneNumberId: config.META_PHONE_NUMBER_ID!,
      graphVersion: config.META_GRAPH_VERSION,
      graphBaseUrl: config.META_GRAPH_BASE_URL,
    });
  }
  if (config.channel === 'telegram')
    return new TelegramChannel({ botToken: config.TELEGRAM_BOT_TOKEN! });
  return new ConsoleChannel();
}

export function buildClassifier(config: Config): FallbackIntentClassifier {
  if (config.AI_INTENT_PROVIDER === 'ollama') {
    return new FallbackIntentClassifier(
      new OllamaIntentClassifier({
        baseUrl: config.OLLAMA_BASE_URL,
        model: config.OLLAMA_MODEL,
        timeoutMs: config.OLLAMA_TIMEOUT_MS,
      }),
    );
  }
  return new FallbackIntentClassifier(null);
}

/** Postgres when DATABASE_URL is set (the schema is applied at startup); otherwise in memory. */
export async function buildStore(config: Config): Promise<SchedulingStore> {
  if (!config.DATABASE_URL) return new MemoryStore();
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({
    connectionString: config.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
    // A hung query must not hold one of five connections forever: the server cancels it at 10 s,
    // and the client gives up at 15 s even if the server never answers.
    statement_timeout: 10_000,
    query_timeout: 15_000,
  });
  return PostgresStore.open(pool);
}

/** null = risk off (fixed reminder cadence); otherwise the sidecar or the heuristic, always with fallback. */
export function buildRisk(config: Config): FallbackRisk | null {
  if (config.RISK_PROVIDER === 'off') return null;
  if (config.RISK_PROVIDER === 'sidecar') {
    return new FallbackRisk(
      new SidecarRiskAdapter({ baseUrl: config.RISK_URL, timeoutMs: config.RISK_TIMEOUT_MS }),
    );
  }
  return new FallbackRisk(null);
}
