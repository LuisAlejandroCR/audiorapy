// store.spec.ts: the store contract on the in-memory store and on Postgres (PGlite).
import { storeContract } from '../../store-contract.ts';
import { openPglite } from '../../pg-helpers.ts';
import { MemoryStore } from '../../../apps/api/src/store/memory-store.ts';

storeContract('memory', async () => ({ store: new MemoryStore(), done: async () => {} }));
storeContract('postgres (PGlite)', async () => {
  const { store, done } = await openPglite();
  return { store, done };
});
