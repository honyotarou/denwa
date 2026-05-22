#!/usr/bin/env node
/**
 * Playwright webServer: prepare isolated DB → next build → next start (port 3010).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { e2eDbPath, e2eWebProcessEnv } from './e2e-paths.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'apps/web');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
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
const env = { ...process.env, ...e2eWebProcessEnv(), PORT: port };

// Stale dev-server .next chunks (e.g. ./8819.js) break production next build.
fs.rmSync(path.join(WEB, '.next'), { recursive: true, force: true });

run('npm', ['run', 'build', '-w', 'command-room-web'], { env });

const child = spawnSync('npx', ['next', 'start', '-p', port], {
  cwd: WEB,
  env,
  stdio: 'inherit',
});
process.exit(child.status ?? 1);
