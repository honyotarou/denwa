import path from 'node:path';
import { fileURLToPath } from 'node:url';

const E2E_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(E2E_DIR, '../..');

export const E2E_RUN_ROOT = path.join(REPO_ROOT, 'data/e2e-run');

export function e2ePjsipExtensionsConf(): string {
  return path.join(E2E_RUN_ROOT, 'pbx-out/pjsip.d/extensions.conf');
}
