#!/usr/bin/env node
/**
 * Architecture gate: 変更容易性・カプセル化・関心の分離を静的に強制。
 * Invoked from check-denwa-static.mjs (pre/post/harness:fast/CI).
 */
import fs from "node:fs";
import path from "node:path";

const MUTATION_SERVICES = [
  "extensions.ts",
  "ring-groups.ts",
  "pickup.ts",
  "phonebook.ts",
  "business-hours.ts",
  "trunks.ts",
  "upgrades.ts",
  "guidance.ts",
  "ivr.ts",
  "admin-policy.ts",
  "auth-login.ts",
];

/** core validate* 必須（認証・単純 delete は除外） */
const SERVICES_REQUIRE_CORE_VALIDATE = [
  "extensions.ts",
  "ring-groups.ts",
  "pickup.ts",
  "phonebook.ts",
  "business-hours.ts",
  "trunks.ts",
  "upgrades.ts",
  "ivr.ts",
];

/** actions は services 経由必須（barrel / shared のみ例外） */
const ACTIONS_SERVICE_ROUTED = [
  "extensions.ts",
  "ring-groups.ts",
  "pickup.ts",
  "phonebook.ts",
  "business-hours.ts",
  "guidance-auth.ts",
  "ivr.ts",
  "admin.ts",
];

const ACTIONS_DB_WHITELIST = new Set(["shared.ts", "impl.ts", "index.ts", "accounts.ts"]);

function readSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function walk(dir, match, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules" || name.name === ".git") continue;
      walk(p, match, acc);
    } else if (match(p)) acc.push(p);
  }
  return acc;
}

function fail(failures, code, rel, message) {
  failures.push(`[${code}] ${rel}: ${message}`);
}

function checkPages(root, failures) {
  const app = path.join(root, "apps/web/src/app");
  for (const file of walk(app, (p) => /page\.tsx$/.test(p))) {
    const rel = path.relative(root, file);
    const text = readSafe(file);
    if (/@openpbx\/db/.test(text) || /better-sqlite3/.test(text) || /getAppDb\s*\(/.test(text)) {
      fail(failures, "T-ARCH-002", rel, "page must not import db/sqlite/getAppDb");
    }
    if (/process\.env/.test(text) || /from ['"]node:path['"]/.test(text)) {
      fail(failures, "T-ARCH-003", rel, "page must not use process.env or node:path (use page-data/paths)");
    }
  }
}

function checkPageData(root, failures) {
  const rel = "apps/web/src/server/page-data.ts";
  const text = readSafe(path.join(root, rel));
  if (!text) return;
  if (/\.prepare\s*\(/.test(text)) {
    fail(failures, "T-ARCH-003", rel, "inline SQL forbidden — use pbx-db repos");
  }
  if (/export function db\s*\(/.test(text)) {
    fail(failures, "T-ARCH-003", rel, "export db() forbidden — keep getAppDb private");
  }
}

function checkPbxDbPackage(root, failures) {
  const rel = "packages/pbx-db/package.json";
  const pkgPath = path.join(root, rel);
  if (!fs.existsSync(pkgPath)) return;
  const pkg = JSON.parse(readSafe(pkgPath));
  if (pkg.dependencies?.["@openpbx/ops"]) {
    fail(failures, "T-ARCH-005", rel, "pbx-db must not depend on @openpbx/ops");
  }
  const prodCheck = readSafe(path.join(root, "packages/pbx-db/src/prod-check.ts"));
  if (/@openpbx\/ops/.test(prodCheck)) {
    fail(failures, "T-ARCH-005", "packages/pbx-db/src/prod-check.ts", "import from @openpbx/core not ops");
  }
}

function checkCorePure(root, failures) {
  const coreSrc = path.join(root, "packages/pbx-core/src");
  if (!fs.existsSync(coreSrc)) return;
  for (const file of walk(coreSrc, (p) => p.endsWith(".ts") && !/\.test\.ts$/.test(p))) {
    const rel = path.relative(root, file);
    const text = readSafe(file);
    if (/from\s+['"]node:fs['"]/.test(text) || /from\s+['"]node:child_process['"]/.test(text)) {
      fail(failures, "T-ARCH-001", rel, "core must not import node:fs or child_process");
    }
  }
}

function checkServicesNoActionsImport(root, failures) {
  const dir = path.join(root, "apps/web/src/server/services");
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".ts")) continue;
    const rel = `apps/web/src/server/services/${name}`;
    const text = readSafe(path.join(dir, name));
    if (/from\s+['"].*\/actions\//.test(text) || /from\s+['"]\.\.\/actions\//.test(text)) {
      fail(failures, "T-SOC-003", rel, "services must not import from actions (use server/audit.ts)");
    }
  }
}

function checkMutationServices(root, failures) {
  const dir = path.join(root, "apps/web/src/server/services");
  for (const name of MUTATION_SERVICES) {
    const rel = `apps/web/src/server/services/${name}`;
    const text = readSafe(path.join(root, rel));
    if (!text) {
      fail(failures, "T-ARCH-004", rel, "mutation service file missing");
      continue;
    }
    if (!SERVICES_REQUIRE_CORE_VALIDATE.includes(name)) continue;
    if (!/@openpbx\/core/.test(text) || !/validate\w+/.test(text)) {
      fail(failures, "T-ARCH-004", rel, "must import validate* from @openpbx/core");
    }
  }
}

function checkActionsUseServices(root, failures) {
  const dir = path.join(root, "apps/web/src/server/actions");
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".ts")) continue;
    if (ACTIONS_DB_WHITELIST.has(name)) continue;
    if (!ACTIONS_SERVICE_ROUTED.includes(name)) continue;
    const rel = `apps/web/src/server/actions/${name}`;
    const text = readSafe(path.join(dir, name));
    if (/\bctx\.db\b/.test(text)) {
      fail(failures, "T-ARCH-006", rel, "actions must not call ctx.db — use server/services/*");
    }
    if (/\bctx\.infra\.sync\w*\(/.test(text)) {
      fail(failures, "T-ARCH-006", rel, "actions must not call ctx.infra.sync* — use server/services/*");
    }
  }
}

function checkApiRoutes(root, failures) {
  const apiDir = path.join(root, "apps/web/src/app/api");
  if (!fs.existsSync(apiDir)) return;
  for (const file of walk(apiDir, (p) => /route\.ts$/.test(p))) {
    const rel = path.relative(root, file);
    if (rel.includes("health/")) continue;
    const text = readSafe(file);
    if (!/buildContextFromRequest\s*\(\s*req\s*\)/.test(text)) {
      fail(failures, "T-API-IP-001", rel, "must use buildContextFromRequest(req)");
    }
    if (/buildContext\s*\(\s*sessionTokenFromCookieHeader/.test(text)) {
      fail(failures, "T-API-IP-001", rel, "cookie-only buildContext bypasses client IP");
    }
  }
}

function checkMiddleware(root, failures) {
  const rel = "apps/web/src/middleware.ts";
  const text = readSafe(path.join(root, rel));
  if (!text) return;
  if (/ipAllowed\s*=\s*true/.test(text)) {
    fail(failures, "T-MW-007", rel, "hardcoded ipAllowed = true forbidden");
  }
  if (!/clientIpOptional/.test(text)) {
    fail(failures, "T-MW-007", rel, "must use clientIpOptional from request-ip");
  }
  if (/from ['"]@\/server\/request-meta['"]/.test(text) || /from ['"]@\/server\/app-context['"]/.test(text)) {
    fail(failures, "T-MW-008", rel, "middleware must not import request-meta/app-context (Edge unsafe)");
  }
}

function checkMiddlewareIp(root, failures) {
  const rel = "apps/web/src/server/middleware-ip.ts";
  const text = readSafe(path.join(root, rel));
  if (!text) return;
  if (/from ['"]@openpbx\/core['"]/.test(text) && !/auth\/policy/.test(text)) {
    fail(failures, "T-MW-008", rel, "use @openpbx/core/auth/policy subpath only (no crypto barrel)");
  }
}

function checkInfraSync(root, failures) {
  const rel = "apps/web/src/server/infra-sync.ts";
  const text = readSafe(path.join(root, rel));
  if (!text) return;
  if (!/renderTrunksPjsipIfValid/.test(text)) {
    fail(failures, "T-INFRA-TRUNK-001", rel, "must use renderTrunksPjsipIfValid");
  }
  if (/renderTrunksPjsip\(trunks\)/.test(text)) {
    fail(failures, "T-INFRA-TRUNK-001", rel, "unvalidated renderTrunksPjsip(trunks) forbidden");
  }
  if (/extensions:\s*\{/.test(text)) {
    fail(failures, "T-SOC-001", rel, "infra.extensions CRUD nest forbidden — use services/extensions");
  }
}

function checkAppActionsSplit(root, failures) {
  const barrel = path.join(root, "apps/web/src/app/actions.ts");
  if (!fs.existsSync(barrel)) return;
  const text = readSafe(barrel);
  const lines = text.split("\n").length;
  if (lines > 25) {
    fail(
      failures,
      "T-SOC-004",
      "apps/web/src/app/actions.ts",
      `barrel must re-export only (max 25 lines, got ${lines})`,
    );
  }
  if (/async function \w+Action/.test(text)) {
    fail(failures, "T-SOC-004", "apps/web/src/app/actions.ts", "implement actions in app/actions/<domain>.ts");
  }
  const legacyHandlers = path.join(root, "apps/web/src/server/api-handlers.ts");
  const hText = readSafe(legacyHandlers);
  if (fs.existsSync(legacyHandlers) && /export async function handle/.test(hText)) {
    fail(
      failures,
      "T-SOC-005",
      "apps/web/src/server/api-handlers.ts",
      "handlers belong in server/api/handlers/* (barrel re-export only)",
    );
  }
}

function checkWebPackageImports(root, failures) {
  const forbidBarrel = (rel, text) => {
    if (/from ['"]@openpbx\/db['"]/.test(text)) {
      fail(failures, "T-PKG-001", rel, "use @openpbx/db/repos/* or @openpbx/db/schema subpaths");
    }
    if (/from ['"]@openpbx\/infra['"]/.test(text)) {
      fail(failures, "T-PKG-001", rel, "use @openpbx/infra/* subpath exports");
    }
  };
  const actionsDir = path.join(root, "apps/web/src/server/actions");
  if (fs.existsSync(actionsDir)) {
    for (const name of fs.readdirSync(actionsDir)) {
      if (!name.endsWith(".ts")) continue;
      forbidBarrel(`apps/web/src/server/actions/${name}`, readSafe(path.join(actionsDir, name)));
    }
    const formsDir = path.join(actionsDir, "forms");
    if (fs.existsSync(formsDir)) {
      for (const name of fs.readdirSync(formsDir)) {
        if (!name.endsWith(".ts")) continue;
        forbidBarrel(`apps/web/src/server/actions/forms/${name}`, readSafe(path.join(formsDir, name)));
      }
    }
  }
  const apiHandlers = path.join(root, "apps/web/src/server/api/handlers");
  if (fs.existsSync(apiHandlers)) {
    for (const name of fs.readdirSync(apiHandlers)) {
      if (!name.endsWith(".ts")) continue;
      forbidBarrel(`apps/web/src/server/api/handlers/${name}`, readSafe(path.join(apiHandlers, name)));
    }
  }
}

function checkWebLib(root, failures) {
  const webLib = path.join(root, "apps/web/src/lib");
  if (!fs.existsSync(webLib)) return;
  for (const file of walk(webLib, (p) => p.endsWith(".ts"))) {
    const rel = path.relative(root, file);
    const text = readSafe(file);
    if (/export function (validate|render|parse|compute)/.test(text)) {
      fail(failures, "T-SOC-002", rel, "domain exports belong in @openpbx/core");
    }
  }
}

/** Run checks applicable to one repo-relative path (pre/post on edit). */
function checkSingleRel(root, rel, failures) {
  if (rel.startsWith("apps/web/src/app/") && rel.endsWith("/page.tsx")) {
    const text = readSafe(path.join(root, rel));
    if (/@openpbx\/db|better-sqlite3|getAppDb\s*\(/.test(text)) {
      fail(failures, "T-ARCH-002", rel, "page must not import db");
    }
    if (/process\.env|node:path/.test(text)) {
      fail(failures, "T-ARCH-003", rel, "page must not use process.env/node:path");
    }
  }
  if (rel === "apps/web/src/server/page-data.ts") checkPageData(root, failures);
  if (rel.startsWith("apps/web/src/server/services/") && MUTATION_SERVICES.includes(path.basename(rel))) {
    const text = readSafe(path.join(root, rel));
    if (!/@openpbx\/core/.test(text) || !/validate\w+/.test(text)) {
      fail(failures, "T-ARCH-004", rel, "must use core validate*");
    }
  }
  if (rel.startsWith("apps/web/src/server/actions/")) {
    const base = path.basename(rel);
    if (ACTIONS_SERVICE_ROUTED.includes(base) && !ACTIONS_DB_WHITELIST.has(base)) {
      const text = readSafe(path.join(root, rel));
      if (/\bctx\.db\b/.test(text)) fail(failures, "T-ARCH-006", rel, "use services not ctx.db");
      if (/\bctx\.infra\.sync/.test(text)) fail(failures, "T-ARCH-006", rel, "use services not infra.sync");
    }
  }
  if (rel.startsWith("apps/web/src/app/api/") && rel.endsWith("/route.ts") && !rel.includes("health/")) {
    const text = readSafe(path.join(root, rel));
    if (!/buildContextFromRequest\s*\(\s*req\s*\)/.test(text)) {
      fail(failures, "T-API-IP-001", rel, "buildContextFromRequest(req) required");
    }
  }
  if (rel === "apps/web/src/server/infra-sync.ts") checkInfraSync(root, failures);
  if (rel.startsWith("packages/pbx-core/src/") && rel.endsWith(".ts") && !rel.includes(".test.")) {
    const text = readSafe(path.join(root, rel));
    if (/node:fs|node:child_process/.test(text)) fail(failures, "T-ARCH-001", rel, "core must stay pure");
  }
  if (rel.startsWith("apps/web/src/lib/") && rel.endsWith(".ts")) {
    const text = readSafe(path.join(root, rel));
    if (/export function (validate|render|parse|compute)/.test(text)) {
      fail(failures, "T-SOC-002", rel, "domain in web/lib forbidden");
    }
  }
}

/**
 * @param {string} root - repo root
 * @param {{ singleRel?: string }} [opts]
 * @returns {string[]} failure lines
 */
export function runArchitectureGate(root, opts = {}) {
  const failures = [];
  if (opts.singleRel) {
    checkSingleRel(root, opts.singleRel.replace(/^\.\//, ""), failures);
    return failures;
  }
  checkPages(root, failures);
  checkPageData(root, failures);
  checkPbxDbPackage(root, failures);
  checkCorePure(root, failures);
  checkServicesNoActionsImport(root, failures);
  checkMutationServices(root, failures);
  checkActionsUseServices(root, failures);
  checkApiRoutes(root, failures);
  checkMiddleware(root, failures);
  checkMiddlewareIp(root, failures);
  checkInfraSync(root, failures);
  checkWebLib(root, failures);
  checkAppActionsSplit(root, failures);
  checkWebPackageImports(root, failures);
  return failures;
}
