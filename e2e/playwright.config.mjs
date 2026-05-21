import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const E2E_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(E2E_DIR, '..');
const ADMIN_STORAGE = path.join(E2E_DIR, '.auth/admin.json');
const e2ePort = process.env.E2E_PORT ?? '3010';
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: E2E_DIR,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      'X-Real-IP': '127.0.0.1',
    },
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'node scripts/e2e-web-server.mjs',
    url: `${baseURL}/api/health`,
    /** Always use isolated data/e2e-run unless explicitly reusing (E2E_REUSE_SERVER=1). */
    reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
    timeout: 240_000,
    cwd: ROOT,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'public', testMatch: /smoke-public\.spec\.ts/ },
    {
      name: 'authenticated',
      testMatch: /(smoke|gap)-(authenticated|softphone)\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: ADMIN_STORAGE },
    },
    {
      name: 'chrome-ext',
      testMatch: /gap-chrome-ext\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
});
