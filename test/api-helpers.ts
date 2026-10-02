// api-helpers.ts: builds the API with test configuration and fake providers. No network.
import { buildApp } from '../apps/api/src/app.ts';
import { loadConfig } from '../apps/api/src/config.ts';
import { ConsoleChannel } from '../apps/api/src/channel/console-channel.ts';
import { FallbackIntentClassifier } from '../apps/api/src/ai/rules-intent.ts';
import { sign } from '../apps/api/src/meta/signature.ts';
import { MemoryStore } from '../apps/api/src/store/memory-store.ts';
import type { IntentClassifierPort } from '@audiorapy/domain';
import { THURSDAY_8AM } from './helpers.ts';

export const SECRET = 'test-app-secret';
export const VERIFY = 'test-verify-token';
export const DASH = 'test-dashboard-token';

export async function testApp(
  opts: { primary?: IntentClassifierPort | null; env?: Record<string, string>; now?: Date } = {},
) {
  const config = loadConfig({
    NODE_ENV: 'test',
    META_APP_SECRET: SECRET,
    META_VERIFY_TOKEN: VERIFY,
    DASHBOARD_TOKEN: DASH,
    ...opts.env,
  });
  const store = new MemoryStore();
  const channel = new ConsoleChannel();
  const classifier = new FallbackIntentClassifier(opts.primary ?? null);
  let clock = opts.now ?? THURSDAY_8AM;
  const app = await buildApp({ config, store, channel, classifier, now: () => clock });
  return { app, store, channel, classifier, setNow: (d: Date) => (clock = d) };
}

export function metaBody(messages: unknown[]): string {
  return JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'waba',
        changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', messages } }],
      },
    ],
  });
}

export const textMsg = (id: string, from: string, body: string) => ({
  id,
  from,
  timestamp: '1790000000',
  type: 'text',
  text: { body },
});
export const buttonMsg = (id: string, from: string, buttonId: string) => ({
  id,
  from,
  timestamp: '1790000000',
  type: 'interactive',
  interactive: { type: 'button_reply', button_reply: { id: buttonId, title: 'x' } },
});

export function signedPost(body: string, secret = SECRET) {
  return {
    method: 'POST' as const,
    url: '/webhook',
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': sign(body, secret) },
    payload: body,
  };
}

/** Escapes non-ASCII as \uXXXX the way Meta does before signing. */
export function metaEscape(json: string): string {
  return json.replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

export function fakeFetch(
  handler: (url: string, init: RequestInit) => Response | Promise<Response>,
): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) =>
    handler(String(input), init ?? {})) as typeof fetch;
}
