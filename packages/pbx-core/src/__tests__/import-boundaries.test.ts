import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORBIDDEN = [/from\s+['"]node:fs['"]/, /from\s+['"]node:child_process['"]/];

function walkTs(dir: string, acc: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) acc = walkTs(p, acc);
    else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) acc.push(p);
  }
  return acc;
}

describe('T-ARCH-001: @openpbx/core has no fs/network imports', () => {
  it('Given core/src When scan Then no node:fs or child_process imports', () => {
    const violations: string[] = [];
    for (const file of walkTs(SRC)) {
      const rel = path.relative(SRC, file);
      if (rel === 'index.ts') continue;
      const text = fs.readFileSync(file, 'utf8');
      for (const re of FORBIDDEN) {
        if (re.test(text)) violations.push(`${rel}: ${re}`);
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });
});
