#!/usr/bin/env node
/**
 * Reset data/e2e-run and seed admin + extensions (T-E2E fixture).
 */
import { rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  E2E_RUN_ROOT,
  e2eDbPath,
  e2eDialplanDir,
  e2ePjsipDir,
  ensureE2eRunDirs,
} from './e2e-paths.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

rmSync(E2E_RUN_ROOT, { recursive: true, force: true });
ensureE2eRunDirs();

const r = spawnSync(
  'npx',
  ['tsx', path.join(ROOT, 'scripts/bootstrap-dev-admin.ts')],
  {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_PATH: e2eDbPath(),
      PJSIP_OUT_DIR: e2ePjsipDir(),
      DIALPLAN_OUT_DIR: e2eDialplanDir(),
    },
  },
);

if (r.status !== 0) process.exit(r.status ?? 1);
console.log('[e2e-prepare] OK', E2E_RUN_ROOT);
