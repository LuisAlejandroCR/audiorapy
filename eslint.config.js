// eslint.config.js: lint rules, including the boundary that keeps partner SDKs out of the domain.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'playwright-report/**',
      'test-results/**',
      '.playwright-cli/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['packages/domain/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '@temporalio/*',
            '@mastra/*',
            '@sentry/*',
            'ollama*',
            'mongodb',
            'whatsapp-api-js',
            'fastify*',
            'react*',
            'node:*',
          ],
        },
      ],
    },
  },
);
