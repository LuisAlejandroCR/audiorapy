// maintenance.spec.ts: the purge runner logs counts and never throws when the store fails.
import { describe, expect, it } from 'vitest';
import { runPurge } from '../../../apps/api/src/service/maintenance.ts';
import { MemoryStore } from '../../../apps/api/src/store/memory-store.ts';

describe('runPurge', () => {
  it('logs the counts', async () => {
    const store = new MemoryStore();
    await store.markProcessed('m1', new Date('2026-01-01T00:00:00Z'));
    const logs: Array<[string, Record<string, unknown>]> = [];
    const r = await runPurge(store, new Date('2026-10-02T00:00:00Z'), (e, f) => logs.push([e, f]));
    expect(r).toEqual({ processedMessages: 1, reminderJobs: 0 });
    expect(logs).toEqual([['maintenance.purged', { processedMessages: 1, reminderJobs: 0 }]]);
  });

  it('a failing store is logged, not thrown', async () => {
    const store = new MemoryStore();
    store.purge = async () => {
      throw new Error('connection terminated');
    };
    const logs: string[] = [];
    expect(await runPurge(store, new Date(), (e) => logs.push(e))).toBeNull();
    expect(logs).toEqual(['maintenance.purge_failed']);
  });
});
