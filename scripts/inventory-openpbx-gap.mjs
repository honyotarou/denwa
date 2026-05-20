#!/usr/bin/env node
/** Phase 0: OpenPBX gap file inventory (T-GAP-INV-*) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OPENPBX = path.join(ROOT, '..', 'OpenPBX');

const EXPECTED = [
  'apps/web/src/app/softphone/softphone.tsx',
  'apps/web/src/app/network/page.tsx',
  'apps/web/src/lib/network.ts',
  'apps/web/src/app/triage/flow.ts',
  'apps/web/src/lib/patients.ts',
  'apps/web/src/app/patients/page.tsx',
  'apps/web/src/app/api/patients/records/route.ts',
  'chrome-extension/manifest.json',
];

function main() {
  if (!fs.existsSync(OPENPBX)) {
    console.error('[gap-inventory] skip: ../OpenPBX not found');
    process.exit(0);
  }
  const missing = [];
  for (const rel of EXPECTED) {
    const p = path.join(OPENPBX, rel);
    if (!fs.existsSync(p)) missing.push(rel);
  }
  if (missing.length) {
    console.error('[gap-inventory] FAILED missing:', missing.join(', '));
    process.exit(1);
  }
  console.log('[gap-inventory] OK', EXPECTED.length, 'paths');
}

main();
