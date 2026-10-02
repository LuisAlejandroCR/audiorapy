// app.ts: HTTP surface — Meta webhook (GET handshake, signed POST), health, the therapist's
// scheduling API (bearer token) and a development-only simulator for the console channel.
import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { formatSlotEs, type ChannelPort, type PortResult } from '@audiorapy/domain';
import type { Config } from './config.ts';
import { FallbackIntentClassifier } from './ai/rules-intent.ts';
import { verifySignature } from './meta/signature.ts';
import { parseWebhook } from './meta/parse.ts';
import { ConsoleChannel } from './channel/console-channel.ts';
import { Inbox } from './service/inbox.ts';
import { tickReminders } from './service/reminders.ts';
import { MemoryStore } from './store/memory-store.ts';

export interface AppDeps {
  config: Config;
  store: MemoryStore;
  channel: ChannelPort;
  classifier: FallbackIntentClassifier;
  now?: () => Date;
}

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: Buffer;
  }
  interface FastifyInstance {
    inbox: Inbox;
  }
}

const MAX_BODY = 512 * 1024;

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const { config, store, channel, classifier } = deps;
  const now = deps.now ?? (() => new Date());
  const app = Fastify({
    bodyLimit: MAX_BODY,
    logger:
      config.NODE_ENV === 'test'
        ? false
        : {
            level: 'info',
            redact: {
              paths: ['req.headers.authorization', 'req.headers["x-hub-signature-256"]'],
              remove: true,
            },
          },
  });

  // Keep the exact bytes: Meta signs them, and re-serializing breaks any message with an accent.
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    (req as FastifyRequest).rawBody = body as Buffer;
    if ((body as Buffer).length === 0) return done(null, {});
    try {
      done(null, JSON.parse((body as Buffer).toString('utf8')));
    } catch {
      const err = new Error('invalid json') as Error & { statusCode: number };
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  if (config.DASHBOARD_ORIGIN) {
    await app.register(cors, {
      origin: config.DASHBOARD_ORIGIN,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Authorization', 'Content-Type'],
    });
  }

  const log = (event: string, fields: Record<string, unknown>) =>
    app.log.info({ event, ...fields });
  const inbox = new Inbox({
    store,
    channel,
    classifier,
    catalogue: { practiceName: config.PRACTICE_NAME, privacyUrl: config.PRIVACY_URL },
    riskEnabled: config.RISK_PROVIDER !== 'off',
    now,
    log,
  });
  app.decorate('inbox', inbox);

  app.get('/health', async () => ({ ok: true }));

  app.get('/health/providers', async () => {
    const primary = classifier.lastPrimary;
    return {
      channel: { active: channel.name, configured: config.channel === 'meta' },
      intent: {
        configured: config.AI_INTENT_PROVIDER,
        active: classifier.primary ? classifier.primary.name : 'rules',
        fallback: 'rules',
        last: primary ? describe(primary) : null,
      },
      risk: { active: config.RISK_PROVIDER === 'off' ? 'off' : 'heuristic' },
      scheduler: { active: 'db-cron' },
      webhook: {
        signatureSecret: Boolean(config.META_APP_SECRET),
        verifyToken: Boolean(config.META_VERIFY_TOKEN),
      },
    };
  });

  app.get('/webhook', async (req, reply) => {
    const q = req.query as Record<string, string | undefined>;
    if (!config.META_VERIFY_TOKEN)
      return reply.code(503).send({ error: 'verify token not configured' });
    if (
      q['hub.mode'] === 'subscribe' &&
      safeEqual(q['hub.verify_token'] ?? '', config.META_VERIFY_TOKEN)
    ) {
      return reply.type('text/plain').send(q['hub.challenge'] ?? '');
    }
    return reply.code(403).send({ error: 'verify token mismatch' });
  });

  app.post('/webhook', async (req, reply) => {
    const check = verifySignature(
      req.rawBody,
      req.headers['x-hub-signature-256'] as string | undefined,
      config.META_APP_SECRET,
    );
    if (check !== 'ok') {
      log('webhook.rejected', { reason: check });
      return reply
        .code(check === 'missing_secret' ? 503 : 401)
        .send({ error: `signature ${check}` });
    }
    const messages = parseWebhook(req.body);
    for (const m of messages) inbox.enqueue(m);
    return reply.code(200).send({ received: messages.length });
  });

  const requireDashboard = async (req: FastifyRequest, reply: import('fastify').FastifyReply) => {
    if (!config.DASHBOARD_TOKEN) return reply.code(503).send({ error: 'dashboard api disabled' });
    const header = req.headers.authorization ?? '';
    if (!header.startsWith('Bearer ') || !safeEqual(header.slice(7), config.DASHBOARD_TOKEN)) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
  };

  app.get('/api/agenda', { preHandler: requireDashboard }, async () => ({
    generatedAt: now().toISOString(),
    appointments: store.listAppointments().map((a) => ({
      ...a,
      label: formatSlotEs(new Date(a.startsAt)),
      contact: maskContact(a.contact),
    })),
    alerts: store.listAlerts().map((a) => ({ ...a, contact: maskContact(a.contact) })),
  }));

  app.post('/api/alerts/:id/resolve', { preHandler: requireDashboard }, async (req, reply) => {
    const { id } = req.params as { id: string };
    return store.resolveAlert(id) ? { ok: true } : reply.code(404).send({ error: 'not found' });
  });

  app.post('/api/reminders/tick', { preHandler: requireDashboard }, async () =>
    tickReminders(store, channel, now()),
  );

  if (
    config.channel === 'console' &&
    config.NODE_ENV !== 'production' &&
    channel instanceof ConsoleChannel
  ) {
    const SimSchema = z.object({
      from: z.string().min(3).max(32),
      text: z.string().max(4096).optional(),
      buttonId: z.string().max(256).optional(),
    });
    let counter = 0;
    app.post('/dev/simulate', async (req, reply) => {
      const parsed = SimSchema.safeParse(req.body);
      if (
        !parsed.success ||
        (parsed.data.text === undefined) === (parsed.data.buttonId === undefined)
      ) {
        return reply.code(400).send({ error: 'send exactly one of text or buttonId' });
      }
      const { from, text, buttonId } = parsed.data;
      const before = channel.outbox.length;
      const result = await inbox.handle({
        id: `sim-${Date.now()}-${counter++}`,
        from,
        timestamp: Math.floor(now().getTime() / 1000),
        inbound: text !== undefined ? { kind: 'text', text } : { kind: 'button', id: buttonId! },
      });
      return {
        ...result,
        replies: channel.outbox.slice(before).map((m) => m.message),
        state: store.getConversation(from),
      };
    });
  }

  return app;
}

function describe(r: PortResult<unknown>) {
  return {
    available: r.available,
    source: r.source,
    checked_at: r.checked_at,
    error: r.available ? null : r.error,
  };
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** The dashboard needs to tell families apart, not to read their numbers. */
export function maskContact(contact: string): string {
  return contact.length <= 4 ? '••••' : `••••${contact.slice(-4)}`;
}
