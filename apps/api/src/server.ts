// server.ts: process entry point — load config, wire providers, start the reminder tick, listen.
import { loadConfig } from './config.ts';
import { buildApp } from './app.ts';
import { buildChannel, buildClassifier } from './providers.ts';
import { tickReminders } from './service/reminders.ts';
import { MemoryStore } from './store/memory-store.ts';

const config = loadConfig();
const store = new MemoryStore();
const channel = buildChannel(config);
const app = await buildApp({ config, store, channel, classifier: buildClassifier(config) });

const timer = setInterval(() => {
  tickReminders(store, channel, new Date()).catch((error: unknown) =>
    app.log.error({
      event: 'reminders.error',
      error: error instanceof Error ? error.message : 'unknown',
    }),
  );
}, 60_000);

const shutdown = async () => {
  clearInterval(timer);
  await app.inbox.idle();
  await app.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ port: config.PORT, host: config.HOST });
app.log.info({
  event: 'startup',
  channel: channel.name,
  intent: config.AI_INTENT_PROVIDER,
  risk: config.RISK_PROVIDER,
});
