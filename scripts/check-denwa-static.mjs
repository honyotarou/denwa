#!/usr/bin/env node
/**
 * Lightweight static gate for denwa (pre-commit / harness:fast).
 * See .cursor/skills/denwa/steps-denwa.md §運用
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runArchitectureGate } from "./denwa-architecture-gate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetArg = process.argv[2];
const targetAbs = targetArg
  ? path.isAbsolute(targetArg)
    ? targetArg
    : path.join(ROOT, targetArg)
  : null;

const failures = [];
const warnings = [];

function walk(dir, acc = [], opts = { testsOnly: true }) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules" || name.name === ".git") continue;
      walk(p, acc, opts);
    } else if (
      opts.testsOnly
        ? /\.(test|spec)\.[cm]?[jt]sx?$/.test(name.name)
        : /\.(tsx?|jsx?)$/.test(name.name)
    ) {
      acc.push(p);
    }
  }
  return acc;
}

function stagedFiles() {
  try {
    const out = execSync("git diff --cached --name-only", {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
    return out ? out.split("\n").filter(Boolean) : [];
  } catch {
    return [];
  }
}

function readSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function checkTestFile(file) {
  const text = readSafe(file);
  const rel = path.relative(ROOT, file);
  if (/\bit\.skip\s*\(/.test(text)) {
    failures.push(`${rel}: it.skip is forbidden (use manual-only in progress table)`);
  }
  if (!file.includes("roadmap.test")) {
    const todos = [...text.matchAll(/\bit\.todo\s*\(\s*['"`]([^'"`]+)/g)];
    for (const [, label] of todos) {
      if (!/^T-[A-Z]+-\d{3}:/.test(label.trim())) {
        warnings.push(
          `${rel}: it.todo without T-XXX-000 prefix — "${label.slice(0, 60)}..."`,
        );
      }
    }
  }
}

function checkWebLibFile(file) {
  const rel = path.relative(ROOT, file);
  const text = readSafe(file);
  if (/export function (validate|render|parse|compute)/.test(text)) {
    failures.push(`${rel}: domain-like exports belong in @openpbx/core, not apps/web/src/lib`);
  }
}

function checkSingleFile(abs) {
  if (!fs.existsSync(abs)) return;
  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(abs) && abs.includes(`${path.sep}packages${path.sep}`)) {
    checkTestFile(abs);
  }
  const webLib = path.join(ROOT, "apps/web/src/lib");
  if (abs.startsWith(webLib) && abs.endsWith(".ts")) {
    checkWebLibFile(abs);
  }
  const rel = path.relative(ROOT, abs);
  for (const line of runArchitectureGate(ROOT, { singleRel: rel })) {
    failures.push(line);
  }
}

// --- it.skip / it.todo / web lib (full tree or single file) ---
if (targetAbs) {
  checkSingleFile(targetAbs);
} else {
  for (const file of walk(path.join(ROOT, "packages"))) {
    checkTestFile(file);
  }
  const webLib = path.join(ROOT, "apps/web/src/lib");
  if (fs.existsSync(webLib)) {
    for (const file of walk(webLib)) {
      checkWebLibFile(file);
    }
  }
  for (const line of runArchitectureGate(ROOT)) {
    failures.push(line);
  }
  const webSrc = path.join(ROOT, "apps/web/src");
  if (fs.existsSync(webSrc)) {
    for (const file of walk(webSrc, [], { testsOnly: false })) {
      const text = readSafe(file);
      if (/cdn\.jsdelivr\.net\/npm\/sip\.js/i.test(text)) {
        failures.push(
          `${path.relative(ROOT, file)}: CDN sip.js forbidden (use npm sip.js dependency)`,
        );
      }
    }
  }
}

// --- staged secret patterns ---
const SECRET_PATH_BLOCK = [
  /\.env$/,
  /\.env\.(?!example$)/,
  /credentials\.json$/,
  /\.pem$/,
  /\.key$/,
];
const SECRET_CONTENT = [
  /admin-please-change/,
  /secret-100[12]/,
  /command-room-ami-secret/,
  /LINE_CHANNEL_ACCESS_TOKEN\s*=/,
];

/** 検知ルール・計画書など、パターン文字列を含んでよい staged ファイル */
const STAGED_SECRET_SCAN_SKIP = new Set([
  "scripts/check-denwa-static.mjs",
  "docs/TDD-REBUILD-PLAN.md",
  "docs/FRONTEND-PLAN.md",
  "docs/OPENPBX-GAP-MIGRATION-TDD-PLAN.md",
  "docs/OPENPBX-GAP-MIGRATION-NON-TDD-PLAN.md",
  "packages/pbx-core/forbidden-tracked-extension-passwords.json",
]);

/** golden / テスト / 開発用 compose・asterisk は TDD 計画の既定値を含む */
function shouldSkipStagedSecretContentScan(rel) {
  if (STAGED_SECRET_SCAN_SKIP.has(rel)) return true;
  if (rel.startsWith("fixtures/golden/")) return true;
  if (rel.startsWith("asterisk/")) return true;
  if (rel === "docker-compose.yml") return true;
  if (rel === "packages/pbx-db/src/apply-schema.ts") return true;
  if (rel === "packages/pbx-db/src/migrate-extensions.ts") return true;
  if (rel === "apps/web/src/server/context.ts") return true;
  if (rel === "scripts/bootstrap-dev-admin.ts") return true;
  if (rel === "scripts/prod-check.ts") return true;
  if (rel === "packages/pbx-ops/src/prod/check.ts") return true;
  if (rel === "packages/pbx-core/src/prod/audit-actions.ts") return true;
  if (rel === "packages/pbx-db/src/prod-check.ts") return true;
  if (rel.includes("/__tests__/")) return true;
  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(rel)) return true;
  return false;
}

for (const rel of stagedFiles()) {
  if (SECRET_PATH_BLOCK.some((re) => re.test(rel))) {
    failures.push(`staged: ${rel} must not be committed (secrets/env)`);
  }
  if (shouldSkipStagedSecretContentScan(rel)) continue;
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
  const text = readSafe(abs);
  for (const re of SECRET_CONTENT) {
    if (re.test(text)) {
      failures.push(`staged: ${rel} contains default secret pattern ${re}`);
    }
  }
}

// --- report ---
for (const w of warnings) {
  console.warn(`[denwa:static:warn] ${w}`);
}
if (failures.length) {
  console.error("[denwa:static] FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("[denwa:static] OK (secrets + architecture SOC/T-TS gate)");
