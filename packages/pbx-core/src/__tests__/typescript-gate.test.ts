import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('T-TS-GATE: TypeScript conventions (static gate mirror)', () => {
  it('Given repo When run-ts-gate Then no T-TS violations', () => {
    expect(() => {
      execSync('node scripts/run-ts-gate.mjs', { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
    }).not.toThrow();
  });
});
