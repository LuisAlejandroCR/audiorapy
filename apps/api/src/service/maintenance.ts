// maintenance.ts: periodic retention purge of operational records (see RETENTION in store.ts).
// Logs only counts. A failure is logged and retried on the next run, never thrown at the caller.
import type { PurgeResult, SchedulingStore } from '../store/store.ts';

export const PURGE_INTERVAL_MS = 6 * 3_600_000;

export async function runPurge(
  store: SchedulingStore,
  now: Date,
  log: (event: string, fields: Record<string, unknown>) => void,
): Promise<PurgeResult | null> {
  try {
    const result = await store.purge(now);
    log('maintenance.purged', { ...result });
    return result;
  } catch (error) {
    log('maintenance.purge_failed', { error: error instanceof Error ? error.message : 'unknown' });
    return null;
  }
}
