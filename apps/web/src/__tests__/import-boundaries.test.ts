import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../app');

function walkPages(dir: string, acc: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walkPages(p, acc);
    else if (/page\.tsx$/.test(name)) acc.push(p);
  }
  return acc;
}

describe('T-ARCH-002: app pages do not import db/sqlite directly', () => {
  it('Given app/**/page.tsx When scan Then no @openpbx/db or better-sqlite3', () => {
    const violations: string[] = [];
    for (const file of walkPages(APP)) {
      const text = fs.readFileSync(file, 'utf8');
      if (/@openpbx\/db/.test(text) || /better-sqlite3/.test(text) || /getAppDb\s*\(/.test(text)) {
        violations.push(path.relative(APP, file));
      }
    }
    expect(violations, violations.join(', ')).toEqual([]);
  });
});

describe('T-MW-007: middleware uses IP resolver', () => {
  it('Given middleware.ts When read Then must not hardcode ipAllowed = true', () => {
    const middlewarePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../middleware.ts');
    const text = fs.readFileSync(middlewarePath, 'utf8');
    expect(text).not.toMatch(/ipAllowed\s*=\s*true/);
    expect(text).toMatch(/resolveMiddlewareIpAllowed/);
  });
});
