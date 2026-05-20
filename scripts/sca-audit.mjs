#!/usr/bin/env node
/** Supply chain gate (T-SCA-001) — high+ vulnerabilities fail harness */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  execSync("npm audit --omit=dev --audit-level=high", {
    cwd: ROOT,
    stdio: "inherit",
    encoding: "utf8",
  });
  console.log("[denwa:sca] OK");
} catch {
  console.error("[denwa:sca] FAILED: npm audit reported high+ vulnerabilities");
  process.exit(1);
}
