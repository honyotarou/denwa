#!/usr/bin/env npx tsx
/** T-SCA-001 + T-SEC-SCA-002/003/004 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectBlockedAdvisories } from '../packages/pbx-core/src/prod/sca-audit-filter.ts';
import { classifyNpmAuditExecError } from '../packages/pbx-core/src/prod/sca-audit-network.ts';
import {
  collectEsbuildInstallViolations,
  collectPostcssInstallViolations,
  collectViteInstallViolations,
  type InstalledPackage,
} from '../packages/pbx-core/src/prod/sca-install-policy.ts';
import type { ScaAdvisory } from '../packages/pbx-core/src/prod/sca-policy.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readPackageVersion(label: string, pkgJsonPath: string): InstalledPackage | null {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    return { name: pkg.name as string, version: pkg.version as string, label };
  } catch {
    return null;
  }
}

function collectPinnedInstalls(): InstalledPackage[] {
  const out: InstalledPackage[] = [];
  const candidates: ReadonlyArray<readonly [string, string]> = [
    ['root>postcss', 'node_modules/postcss/package.json'],
    ['next>postcss', 'node_modules/next/node_modules/postcss/package.json'],
    ['vite', 'node_modules/vite/package.json'],
    ['vite>esbuild', 'node_modules/vite/node_modules/esbuild/package.json'],
    ['esbuild', 'node_modules/esbuild/package.json'],
    ['tsx>esbuild', 'node_modules/tsx/node_modules/esbuild/package.json'],
  ];
  for (const [label, rel] of candidates) {
    const pkg = readPackageVersion(label, path.join(ROOT, rel));
    if (pkg) out.push(pkg);
  }
  return out;
}

function npmAuditJson(args: string): { data: unknown } | { skip: true; detail: string } {
  try {
    const stdout = execSync(`npm audit ${args} --json`, { cwd: ROOT, encoding: 'utf8' });
    return { data: JSON.parse(stdout) };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message?: string; status?: number };
    if (err.stdout) {
      try {
        return { data: JSON.parse(err.stdout) };
      } catch {
        /* fall through */
      }
    }
    const outcome = classifyNpmAuditExecError(err);
    if (outcome.kind === 'skip') return { skip: true, detail: outcome.detail };
    throw e;
  }
}

function parseAdvisories(data: {
  vulnerabilities?: Record<string, { name: string; severity: string; via: unknown[] }>;
}): ScaAdvisory[] {
  const advisories: ScaAdvisory[] = [];
  for (const v of Object.values(data.vulnerabilities ?? {})) {
    const via = (v.via ?? []).map((x) =>
      typeof x === 'string' ? x : ((x as { name?: string }).name ?? 'unknown'),
    );
    advisories.push({ name: v.name, severity: v.severity, via });
  }
  return advisories;
}

function failIfAny(label: string, errors: readonly string[]): void {
  if (errors.length === 0) return;
  console.error(`[denwa:sca] ${label} FAILED:`, errors.join('; '));
  process.exit(1);
}

const installErrors = [
  ...collectPostcssInstallViolations(collectPinnedInstalls()),
  ...collectEsbuildInstallViolations(collectPinnedInstalls()),
  ...collectViteInstallViolations(collectPinnedInstalls()),
];
failIfAny('T-SEC-SCA install pins', installErrors);

try {
  execSync('npm audit --audit-level=high', { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
} catch (e) {
  const outcome = classifyNpmAuditExecError(e as { status?: number; stderr?: string; stdout?: string; message?: string });
  if (outcome.kind === 'skip') {
    console.warn('[denwa:sca] SKIP T-SEC-SCA-002/003: npm registry unavailable (offline?)');
    console.warn(`[denwa:sca] ${outcome.detail.split('\n').find(Boolean) ?? outcome.detail}`);
    console.log('[denwa:sca] OK (install pins only)');
    process.exit(0);
  }
  console.error('[denwa:sca] FAILED: high+ vulnerabilities (all deps)');
  process.exit(1);
}

const prodResult = npmAuditJson('--omit=dev');
if ('skip' in prodResult && prodResult.skip) {
  console.warn('[denwa:sca] SKIP T-SEC-SCA-002/003: npm registry unavailable (offline?)');
  console.log('[denwa:sca] OK (install pins only)');
  process.exit(0);
}
const prodBlocked = collectBlockedAdvisories(
  parseAdvisories(prodResult.data as { vulnerabilities?: Record<string, unknown> }),
);
failIfAny('T-SEC-SCA-002 prod moderate+', prodBlocked);

const devResult = npmAuditJson('');
if ('skip' in devResult && devResult.skip) {
  console.warn('[denwa:sca] SKIP T-SEC-SCA-002/003: npm registry unavailable (offline?)');
  console.log('[denwa:sca] OK (install pins only)');
  process.exit(0);
}
const devBlocked = collectBlockedAdvisories(
  parseAdvisories(devResult.data as { vulnerabilities?: Record<string, unknown> }),
);
failIfAny('T-SEC-SCA-003 dev moderate+', devBlocked);

console.log('[denwa:sca] T-SEC-SCA-002 prod moderate+ OK');
console.log('[denwa:sca] T-SEC-SCA-003 dev moderate+ OK');
console.log('[denwa:sca] OK');
