#!/usr/bin/env npx tsx
/**
 * Production readiness check (T-PROD-001〜008).
 * Fails on repository defaults unless secrets were rotated.
 */
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runProdCheckDatabase } from '../packages/pbx-db/src/prod-check.js';
import {
  formatProdCheckReport,
  mergeProdCheckResults,
  prodCheckSecretsReady,
  runProdCheckFiles,
} from '../packages/pbx-core/src/prod/check.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let dbPath = process.env.DATABASE_PATH ?? '';
let acceptEmptyIpAllow = false;
let expectPass = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--db' && args[i + 1]) {
    dbPath = args[++i]!;
  } else if (args[i] === '--accept-empty-ip-allow') {
    acceptEmptyIpAllow = true;
  } else if (args[i] === '--expect-pass') {
    expectPass = true;
  }
}

const fileResult = runProdCheckFiles({ repoRoot: ROOT });
let findings = [...fileResult.findings];

if (dbPath) {
  const abs = path.isAbsolute(dbPath) ? dbPath : path.join(ROOT, dbPath);
  if (!fs.existsSync(abs)) {
    console.error(`database not found: ${abs}`);
    process.exit(1);
  }
  const db = new Database(abs, { readonly: true });
  try {
    findings = [...findings, ...runProdCheckDatabase(db, { acceptEmptyIpAllow })];
  } finally {
    db.close();
  }
}

const eight = prodCheckSecretsReady(findings);
findings = [...findings, eight];
const failures = findings.filter((f) => f.severity === 'fail');
const result = { ok: failures.length === 0, findings };
console.log(formatProdCheckReport(result));

if (expectPass && !result.ok) process.exit(1);
if (!expectPass && result.ok) {
  console.error('prod-check passed unexpectedly on repository defaults');
  process.exit(1);
}
process.exit(result.ok ? 0 : 1);
