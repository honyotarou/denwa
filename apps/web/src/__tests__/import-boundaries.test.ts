import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.join(ROOT, 'app');
const SERVER = path.join(ROOT, 'server');

function walk(dir: string, match: (p: string) => boolean, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, match, acc);
    else if (match(p)) acc.push(p);
  }
  return acc;
}

describe('T-ARCH-002: app pages do not import db/sqlite directly', () => {
  it('Given app/**/page.tsx When scan Then no @openpbx/db or better-sqlite3', () => {
    const violations: string[] = [];
    for (const file of walk(APP, (p) => /page\.tsx$/.test(p))) {
      const text = fs.readFileSync(file, 'utf8');
      if (/@openpbx\/db/.test(text) || /better-sqlite3/.test(text) || /getAppDb\s*\(/.test(text)) {
        violations.push(path.relative(ROOT, file));
      }
    }
    expect(violations, violations.join(', ')).toEqual([]);
  });
});

describe('T-ARCH-003: pages and page-data boundaries', () => {
  it('Given page.tsx When scan Then no process.env or node:path', () => {
    const violations: string[] = [];
    for (const file of walk(APP, (p) => /page\.tsx$/.test(p))) {
      const text = fs.readFileSync(file, 'utf8');
      if (/process\.env/.test(text) || /from ['"]node:path['"]/.test(text)) {
        violations.push(path.relative(ROOT, file));
      }
    }
    expect(violations, violations.join(', ')).toEqual([]);
  });

  it('Given page-data.ts When read Then no inline SQL or exported db()', () => {
    const text = fs.readFileSync(path.join(SERVER, 'page-data.ts'), 'utf8');
    expect(text).not.toMatch(/\.prepare\s*\(/);
    expect(text).not.toMatch(/export function db\s*\(/);
  });
});

describe('T-ARCH-004: mutation services use core validation', () => {
  const MUTATION_SERVICES = [
    'ring-groups.ts',
    'pickup.ts',
    'phonebook.ts',
    'business-hours.ts',
    'trunks.ts',
    'upgrades.ts',
    'extensions.ts',
  ];

  it('Given server/services/* When mutation file Then imports validate from @openpbx/core', () => {
    const violations: string[] = [];
    for (const name of MUTATION_SERVICES) {
      const file = path.join(SERVER, 'services', name);
      const text = fs.readFileSync(file, 'utf8');
      if (!/validate\w+/.test(text) || !/@openpbx\/core/.test(text)) {
        violations.push(name);
      }
    }
    expect(violations, violations.join(', ')).toEqual([]);
  });
});

describe('T-ARCH-005: pbx-db does not depend on ops', () => {
  it('Given packages/pbx-db/package.json When read Then no @openpbx/ops dependency', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(ROOT, '../../../packages/pbx-db/package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string> };
    expect(pkg.dependencies?.['@openpbx/ops']).toBeUndefined();
  });
});

describe('T-API-IP-001: API routes use buildContextFromRequest', () => {
  it('Given api/**/route.ts (except health) When read Then buildContextFromRequest(req)', () => {
    const violations: string[] = [];
    for (const file of walk(path.join(APP, 'api'), (p) => /route\.ts$/.test(p))) {
      const rel = path.relative(ROOT, file);
      if (rel.includes('health/')) continue;
      const text = fs.readFileSync(file, 'utf8');
      if (!/buildContextFromRequest\s*\(\s*req\s*\)/.test(text)) {
        violations.push(rel);
      }
      if (/buildContext\s*\(\s*sessionTokenFromCookieHeader/.test(text)) {
        violations.push(`${rel} (legacy cookie-only context)`);
      }
    }
    expect(violations, violations.join(', ')).toEqual([]);
  });
});

describe('T-MW-007: middleware uses IP resolver', () => {
  it('Given middleware.ts When read Then uses clientIpOptional', () => {
    const text = fs.readFileSync(path.join(ROOT, 'middleware.ts'), 'utf8');
    expect(text).not.toMatch(/ipAllowed\s*=\s*true/);
    expect(text).toMatch(/resolveMiddlewareIpAllowed/);
    expect(text).toMatch(/clientIpOptional/);
  });
});

describe('T-SOC-003: services do not import actions layer', () => {
  it('Given server/services/* When read Then no ../actions imports', () => {
    const dir = path.join(SERVER, 'services');
    const violations: string[] = [];
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.ts')) continue;
      const text = fs.readFileSync(path.join(dir, name), 'utf8');
      if (/from\s+['"].*\/actions\//.test(text) || /from\s+['"]\.\.\/actions\//.test(text)) {
        violations.push(name);
      }
    }
    expect(violations, violations.join(', ')).toEqual([]);
  });
});

describe('T-ARCH-006: migrated actions delegate to services', () => {
  const SERVICE_ROUTED = [
    'extensions.ts',
    'ring-groups.ts',
    'pickup.ts',
    'phonebook.ts',
    'business-hours.ts',
    'guidance-auth.ts',
    'ivr.ts',
    'admin.ts',
  ];

  it('Given server/actions/* When service-routed file Then no ctx.db or ctx.infra.sync', () => {
    const violations: string[] = [];
    const dir = path.join(SERVER, 'actions');
    for (const name of SERVICE_ROUTED) {
      const file = path.join(dir, name);
      const text = fs.readFileSync(file, 'utf8');
      if (/\bctx\.db\b/.test(text)) violations.push(`${name} (ctx.db)`);
      if (/\bctx\.infra\.sync\w*\(/.test(text)) violations.push(`${name} (ctx.infra.sync)`);
    }
    expect(violations, violations.join(', ')).toEqual([]);
  });
});

describe('T-SOC-004: app actions and api handlers are split', () => {
  it('Given app/actions.ts When read Then barrel only', () => {
    const text = fs.readFileSync(path.join(ROOT, 'app/actions.ts'), 'utf8');
    expect(text.split('\n').length).toBeLessThanOrEqual(25);
    expect(text).not.toMatch(/async function \w+Action/);
  });

  it('Given api-handlers.ts When read Then re-export barrel only', () => {
    const text = fs.readFileSync(path.join(SERVER, 'api-handlers.ts'), 'utf8');
    expect(text).not.toMatch(/export async function handle\w+/);
  });
});

describe('T-PKG-001: actions/forms use db subpaths not barrel', () => {
  it('Given actions/forms/*.ts When read Then no @openpbx/db barrel', () => {
    const dir = path.join(SERVER, 'actions/forms');
    const violations: string[] = [];
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.ts')) continue;
      const text = fs.readFileSync(path.join(dir, name), 'utf8');
      if (/from ['"]@openpbx\/db['"]/.test(text)) violations.push(name);
    }
    expect(violations, violations.join(', ')).toEqual([]);
  });
});

describe('T-INFRA-TRUNK-001: trunk sync uses validated render', () => {
  it('Given infra-sync.ts When read Then renderTrunksPjsipIfValid', () => {
    const text = fs.readFileSync(path.join(SERVER, 'infra-sync.ts'), 'utf8');
    expect(text).toMatch(/renderTrunksPjsipIfValid/);
    expect(text).not.toMatch(/renderTrunksPjsip\(trunks\)/);
  });
});
