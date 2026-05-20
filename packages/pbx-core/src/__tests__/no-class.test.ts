import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

const TS_DIRS = [
  'packages/pbx-core/src',
  'packages/pbx-db/src',
  'packages/pbx-infra/src',
  'apps/web/src/server',
];

function walkTs(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      if (name === 'node_modules') continue;
      walkTs(p, acc);
    } else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) acc.push(p);
  }
  return acc;
}

describe('T-TS-003: no class in domain packages', () => {
  it('Given src When scan Then no export class or class extends Error', () => {
    const violations: string[] = [];
    for (const rel of TS_DIRS) {
      for (const file of walkTs(path.join(ROOT, rel))) {
        const text = fs.readFileSync(file, 'utf8');
        if (/export\s+class\s+\w+/.test(text) || /class\s+\w+\s+extends\s+Error/.test(text)) {
          violations.push(path.relative(ROOT, file));
        }
      }
    }
    expect(violations, violations.join(', ')).toEqual([]);
  });
});

describe('T-TS-004: no instanceof custom errors', () => {
  const re = /instanceof\s+(Duplicate|NotFound|Auth|AmiOriginate|UnsafePath|Constraint|Fs|Db)Error\b/;

  it('Given src When scan Then no instanceof custom *Error', () => {
    const violations: string[] = [];
    for (const rel of TS_DIRS) {
      for (const file of walkTs(path.join(ROOT, rel))) {
        const text = fs.readFileSync(file, 'utf8');
        if (re.test(text)) violations.push(path.relative(ROOT, file));
      }
    }
    expect(violations, violations.join(', ')).toEqual([]);
  });
});
