import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Isolated runtime tree for Playwright (never commit). */
export const E2E_RUN_ROOT = path.join(ROOT, 'data/e2e-run');

export function e2eDbPath() {
  return path.join(E2E_RUN_ROOT, 'db/command-room.sqlite');
}

export function e2ePjsipDir() {
  return path.join(E2E_RUN_ROOT, 'pbx-out/pjsip.d');
}

export function e2eDialplanDir() {
  return path.join(E2E_RUN_ROOT, 'pbx-out/dialplan.d');
}

export function e2ePjsipExtensionsConf() {
  return path.join(e2ePjsipDir(), 'extensions.conf');
}

/** Env for `next start` when cwd is apps/web. */
export function e2eWebProcessEnv() {
  return {
    NODE_ENV: 'test',
    DATABASE_PATH: path.relative(path.join(ROOT, 'apps/web'), e2eDbPath()),
    PJSIP_OUT_DIR: path.relative(path.join(ROOT, 'apps/web'), e2ePjsipDir()),
    DIALPLAN_OUT_DIR: path.relative(path.join(ROOT, 'apps/web'), e2eDialplanDir()),
    ASTERISK_SIGNAL_DIR: path.relative(path.join(ROOT, 'apps/web'), path.join(E2E_RUN_ROOT, 'signals')),
    RECORDINGS_DIR: path.relative(path.join(ROOT, 'apps/web'), path.join(E2E_RUN_ROOT, 'recordings')),
    SOUNDS_DIR: path.relative(path.join(ROOT, 'apps/web'), path.join(ROOT, 'asterisk/sounds')),
  };
}

export function ensureE2eRunDirs() {
  for (const d of [
    path.dirname(e2eDbPath()),
    e2ePjsipDir(),
    e2eDialplanDir(),
    path.join(E2E_RUN_ROOT, 'signals'),
    path.join(E2E_RUN_ROOT, 'recordings'),
  ]) {
    fs.mkdirSync(d, { recursive: true });
  }
}
