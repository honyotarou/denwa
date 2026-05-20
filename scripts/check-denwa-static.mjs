#!/usr/bin/env node
/**
 * Lightweight static gate for denwa (pre-commit / harness:fast).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetArg = process.argv[2];
const targetAbs = targetArg
  ? path.isAbsolute(targetArg)
    ? targetArg
    : path.join(ROOT, targetArg)
  : null;

const failures = [];
const warnings = [];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules" || name.name === ".git") continue;
      walk(p, acc);
    } else if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(name.name)) {
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
    failures.push(`${rel}: it.skip is forbidden`);
  }
  if (!file.includes("roadmap.test")) {
    const todos = [...text.matchAll(/\bit\.todo\s*\(\s*['"`]([^'"`]+)/g)];
    for (const [, label] of todos) {
      if (!/^T-[A-Z]+-\d{3}:/.test(label.trim())) {
        warnings.push(`${rel}: it.todo without T-XXX-000 prefix`);
      }
    }
  }
}

function checkWebLibFile(file) {
  const rel = path.relative(ROOT, file);
  const text = readSafe(file);
  if (/export function (validate|render|parse|compute)/.test(text)) {
    failures.push(`${rel}: domain logic belongs in @openpbx/core`);
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
}

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
}

const SECRET_PATTERNS = [/\.env$/, /\.env\./, /credentials\.json$/, /\.pem$/, /\.key$/];
const SECRET_CONTENT = [
  /admin-please-change/,
  /secret-100[12]/,
  /command-room-ami-secret/,
  /LINE_CHANNEL_ACCESS_TOKEN\s*=/,
];
const STAGED_SECRET_SCAN_SKIP = new Set([
  "scripts/check-denwa-static.mjs",
  "docs/TDD-REBUILD-PLAN.md",
  "docs/FRONTEND-PLAN.md",
]);

for (const rel of stagedFiles()) {
  if (SECRET_PATTERNS.some((re) => re.test(rel))) {
    failures.push(`staged: ${rel} must not be committed`);
  }
  if (STAGED_SECRET_SCAN_SKIP.has(rel)) continue;
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
  const text = readSafe(abs);
  for (const re of SECRET_CONTENT) {
    if (re.test(text)) {
      failures.push(`staged: ${rel} contains default secret pattern ${re}`);
    }
  }
}

for (const w of warnings) console.warn(`[denwa:static:warn] ${w}`);
if (failures.length) {
  console.error("[denwa:static] FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("[denwa:static] OK");
