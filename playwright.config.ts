// playwright.config.ts: end-to-end tests against the built dashboard (vite preview, production CSP)
// and the real API process in console-channel mode.
import { defineConfig, devices } from '@playwright/test';

const WEB = 'http://127.0.0.1:4174';
const API = 'http://127.0.0.1:3100';
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: 'test/e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: WEB,
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], launchOptions: executablePath ? { executablePath } : {} },
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
  webServer: [
    {
      command: 'node --import tsx apps/api/src/server.ts',
      url: `${API}/health`,
      reuseExistingServer: false,
      env: {
        PORT: '3100',
        NODE_ENV: 'development',
        DASHBOARD_TOKEN: 'e2e-token',
        DASHBOARD_ORIGIN: WEB,
      },
    },
    {
      command:
        'npm run build -w @audiorapy/web && npm run preview -w @audiorapy/web -- --port 4174 --host 127.0.0.1',
      url: WEB,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
