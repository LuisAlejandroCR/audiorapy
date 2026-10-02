// vite.config.ts: dashboard build. The production build ships a strict Content-Security-Policy: the page
// loads nothing it does not own and only talks to itself, the local API and local Ollama.
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// The scheduling API origin is fixed at build time (VITE_API_ORIGIN); the page may talk to nothing else remote.
const API_ORIGIN = process.env.VITE_API_ORIGIN ?? '';

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  `connect-src 'self' http://localhost:* http://127.0.0.1:*${API_ORIGIN ? ` ${API_ORIGIN}` : ''}`,
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');

function cspOnBuild(): Plugin {
  return {
    name: 'audiorapy-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace(
        '<!-- csp -->',
        `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      ),
  };
}

export default defineConfig({
  plugins: [react(), cspOnBuild()],
  resolve: {
    alias: {
      '@audiorapy/domain': fileURLToPath(
        new URL('../../packages/domain/src/index.ts', import.meta.url),
      ),
    },
  },
  build: { target: 'es2022', sourcemap: false },
});
