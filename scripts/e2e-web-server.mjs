#!/usr/bin/env node
/**
 * Playwright webServer: prepare isolated DB → next build → next start (port 3010).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { e2eWebProcessEnv } from './e2e-paths.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'apps/web');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run(process.execPath, [path.join(ROOT, 'scripts/e2e-prepare.mjs')]);

const port = process.env.E2E_PORT ?? '3010';
const env = { ...process.env, ...e2eWebProcessEnv(), PORT: port };

run('npm', ['run', 'build', '-w', 'command-room-web'], { env });

const child = spawnSync('npx', ['next', 'start', '-p', port], {
  cwd: WEB,
  env,
  stdio: 'inherit',
});
process.exit(child.status ?? 1);
