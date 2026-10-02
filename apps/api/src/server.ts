// server.ts: process entry point — load config, wire providers, start the reminder tick, listen.
import { loadConfig } from './config.ts';
import { buildApp } from './app.ts';
import { buildChannel, buildClassifier, buildStore } from './providers.ts';
import { PURGE_INTERVAL_MS, runPurge } from './service/maintenance.ts';
import { tickReminders } from './service/reminders.ts';

const config = loadConfig();
// The database is the source of truth: if it is configured but unreachable, stop with a clear
// message instead of silently falling back to memory and losing bookings.
const store = await buildStore(config).catch((error: unknown) => {
  process.stderr.write(
    `${JSON.stringify({ level: 50, event: 'startup.store_unreachable', error: error instanceof Error ? error.message : 'unknown' })}\n`,
  );
  process.exit(1);
});
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

const logEvent = (event: string, fields: Record<string, unknown>) =>
  app.log.info({ event, ...fields });
void runPurge(store, new Date(), logEvent);
const purgeTimer = setInterval(() => void runPurge(store, new Date(), logEvent), PURGE_INTERVAL_MS);
purgeTimer.unref();

const shutdown = async () => {
  clearInterval(timer);
  clearInterval(purgeTimer);
  await app.inbox.idle();
  await app.close();
  await store.close();
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
