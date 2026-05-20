#!/usr/bin/env node
/** Vitest / CI 用: T-TS-* のみ抽出して exit 1 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runArchitectureGate } from "./denwa-architecture-gate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = runArchitectureGate(ROOT).filter((line) => /\[T-TS-/.test(line));

if (failures.length) {
  console.error("[denwa:ts-gate] FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("[denwa:ts-gate] OK");
