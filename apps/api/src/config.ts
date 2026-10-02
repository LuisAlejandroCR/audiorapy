// config.ts: environment parsing. Every provider is optional; a missing key selects the local fallback.
import { z } from 'zod';

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? v.trim() : undefined));

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('127.0.0.1'),
  META_ACCESS_TOKEN: optional,
  META_PHONE_NUMBER_ID: optional,
  META_APP_SECRET: optional,
  META_VERIFY_TOKEN: optional,
  META_GRAPH_VERSION: z.string().default('v25.0'),
  META_GRAPH_BASE_URL: z.string().url().default('https://graph.facebook.com'),
  AI_INTENT_PROVIDER: z.enum(['ollama', 'rules']).default('rules'),
  OLLAMA_BASE_URL: z.string().url().default('http://127.0.0.1:11434'),
  OLLAMA_MODEL: z.string().default('gemma4:e4b'),
  OLLAMA_TIMEOUT_MS: z.coerce.number().int().min(100).max(60_000).default(8000),
  DATABASE_URL: optional,
  RISK_PROVIDER: z.enum(['sidecar', 'heuristic', 'off']).default('heuristic'),
  RISK_URL: z.string().url().default('http://127.0.0.1:8090'),
  RISK_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(3000),
  DASHBOARD_TOKEN: optional,
  DASHBOARD_ORIGIN: optional,
  PRACTICE_NAME: z.string().default('Fonoaudiología a domicilio'),
  PRIVACY_URL: z.string().url().default('https://example.org/privacidad'),
});

/** Every environment variable the API reads; deployment blueprints may only set these. */
export const CONFIG_KEYS = Object.keys(EnvSchema.shape);

export type Config = z.infer<typeof EnvSchema> & {
  channel: 'meta' | 'console';
};

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const parsed = EnvSchema.parse(env);
  const channel = parsed.META_ACCESS_TOKEN && parsed.META_PHONE_NUMBER_ID ? 'meta' : 'console';
  return { ...parsed, channel };
}
