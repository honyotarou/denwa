#!/usr/bin/env node
/**
 * Playwright webServer: prepare isolated DB → next build → next start (port 3010).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { e2eDbPath, e2eWebProcessEnv } from './e2e-paths.mjs';

// Must be set before any `next` subprocess loads next.config.ts
process.env.E2E_BUILD = '1';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'apps/web');
const E2E_DIST = path.join(WEB, '.next-e2e');

function ensurePortFree(port) {
  const r = spawnSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], { encoding: 'utf8' });
  const pid = r.stdout?.trim();
  if (!pid) return;
  console.error(
    `[e2e] port ${port} is already in use (pid ${pid}). ` +
      `Stop the other server first: kill $(lsof -ti :${port})`,
  );
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function cleanE2eDist() {
  fs.rmSync(E2E_DIST, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}

function buildWeb(env, attempt = 1) {
  cleanE2eDist();
  const r = spawnSync('npx', ['next', 'build'], { cwd: WEB, env, stdio: 'inherit' });
  if (r.status !== 0) {
    if (attempt < 2) {
      console.error('[e2e] next build failed; retrying after clean .next-e2e');
      return buildWeb(env, attempt + 1);
    }
    process.exit(r.status ?? 1);
  }
}

run(process.execPath, [path.join(ROOT, 'scripts/e2e-prepare.mjs')]);

run('npx', ['tsx', path.join(ROOT, 'scripts/e2e-seed-click2call-token.ts')], {
  env: {
    ...process.env,
    DATABASE_PATH: e2eDbPath(),
    E2E_PORT: process.env.E2E_PORT ?? '3010',
  },
});

const port = process.env.E2E_PORT ?? '3010';
ensurePortFree(port);
const env = { ...process.env, ...e2eWebProcessEnv(), PORT: port };

buildWeb(env);

const child = spawnSync('npx', ['next', 'start', '-p', port], {
  cwd: WEB,
  env,
  stdio: 'inherit',
});
process.exit(child.status ?? 1);
