// vitest.config.ts: test projects (unit, fuzz, invariant, integration) that each run on their own.
// `integration` needs a real Postgres (DATABASE_URL) and is not part of `npm test`.
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const alias = {
  '@audiorapy/domain': fileURLToPath(new URL('./packages/domain/src/index.ts', import.meta.url)),
};

const project = (name: string, pattern: string, testTimeout = 10_000) => ({
  resolve: { alias },
  test: { name, include: [pattern], environment: 'node', testTimeout },
});

export default defineConfig({
  test: {
    projects: [
      project('unit', 'test/unit/**/*.spec.ts'),
      project('fuzz', 'test/fuzz/**/*.fuzz.spec.ts', 60_000),
      project('invariant', 'test/invariant/**/*.invariant.spec.ts', 60_000),
      project('integration', 'test/integration/**/*.integration.spec.ts', 60_000),
    ],
  },
});
