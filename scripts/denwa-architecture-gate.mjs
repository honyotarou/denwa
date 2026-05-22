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
  if (!/clientIpForMiddleware/.test(text)) {
    fail(failures, "T-MW-007", rel, "must use clientIpForMiddleware from request-ip");
  }
  if (/from ['"]@\/server\/request-meta['"]/.test(text) || /from ['"]@\/server\/app-context['"]/.test(text)) {
    fail(failures, "T-MW-008", rel, "middleware must not import request-meta/app-context (Edge unsafe)");
  }
}

function checkMiddlewareIp(root, failures) {
  const rel = "apps/web/src/server/middleware-ip.ts";
  const mip = readSafe(path.join(root, rel));
  if (mip && !/auth\/middleware-ip-policy/.test(mip)) {
    fail(failures, "T-SEC-IP-001", rel, "must delegate to @openpbx/core/auth/middleware-ip-policy");
  }
  const text = readSafe(path.join(root, rel));
  if (!text) return;
  if (/from ['"]@openpbx\/core['"]/.test(text) && !/auth\/(policy|middleware-ip-policy)/.test(text)) {
    fail(failures, "T-MW-008", rel, "use @openpbx/core/auth/* subpath only (no crypto barrel)");
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

/** §5.4.1: export class 禁止 — tag + factory でエラー・値オブジェクトを表現 */
const TS_CONVENTION_DIRS = [
  "packages/pbx-core/src",
  "packages/pbx-db/src",
  "packages/pbx-infra/src",
  "apps/web/src/server",
];

/** mutation service は core 境界で brand 化必須 */
const BRAND_BOUNDARY_SERVICES = {
  "extensions.ts": /toExtensionDraft\s*\(/,
  "ivr.ts": /toIvrMenuDraft\s*\(/,
};

/** 実行時に消える class ベースエラー — instanceof / new 禁止（Error 本体は可） */
const CUSTOM_ERROR_NAMES =
  "Duplicate|NotFound|Auth|AmiOriginate|UnsafePath|Constraint|Fs|Db";
const INSTANCEOF_CUSTOM_ERROR = new RegExp(
  `instanceof\\s+(${CUSTOM_ERROR_NAMES})Error\\b`,
);
const NEW_CUSTOM_ERROR = new RegExp(`new\\s+(${CUSTOM_ERROR_NAMES})Error\\s*\\(`);

function checkNoExportClass(root, failures) {
  for (const relDir of TS_CONVENTION_DIRS) {
    const dir = path.join(root, relDir);
    if (!fs.existsSync(dir)) continue;
    for (const file of walk(dir, (p) => p.endsWith(".ts") && !p.endsWith(".test.ts"))) {
      const rel = path.relative(root, file);
      const text = readSafe(file);
      if (/export\s+class\s+\w+/.test(text)) {
        fail(failures, "T-TS-003", rel, "export class forbidden — use tag + factory");
      }
      if (/class\s+\w+\s+extends\s+Error/.test(text)) {
        fail(failures, "T-TS-003", rel, "class extends Error forbidden — use tag + factory");
      }
    }
  }
}

function checkNoInstanceofCustomErrors(root, failures) {
  for (const relDir of TS_CONVENTION_DIRS) {
    const dir = path.join(root, relDir);
    if (!fs.existsSync(dir)) continue;
    for (const file of walk(dir, (p) => p.endsWith(".ts") && !p.endsWith(".test.ts"))) {
      const rel = path.relative(root, file);
      const text = readSafe(file);
      if (INSTANCEOF_CUSTOM_ERROR.test(text)) {
        fail(
          failures,
          "T-TS-004",
          rel,
          "instanceof custom *Error forbidden — use isXxxError(e) tag guard",
        );
      }
      if (NEW_CUSTOM_ERROR.test(text)) {
        fail(failures, "T-TS-004", rel, "new CustomError() forbidden — use xxxError() factory");
      }
    }
  }
}

/** core の *Draft 型は Readonly + branded number（Input は string 可） */
function checkCoreDraftConventions(root, failures) {
  const coreSrc = path.join(root, "packages/pbx-core/src");
  if (!fs.existsSync(coreSrc)) return;
  for (const file of walk(coreSrc, (p) => p.endsWith(".ts") && !/\.test\.ts$/.test(p))) {
    const rel = path.relative(root, file);
    const text = readSafe(file);
    if (/export\s+type\s+\w+Draft\s*=\s*\{/.test(text)) {
      fail(failures, "T-TS-002", rel, "*Draft types must use Readonly<{…}>");
    }
  }
  const ext = readSafe(path.join(coreSrc, "extension.ts"));
  if (ext && !/number:\s*ExtensionNumber/.test(ext)) {
    fail(failures, "T-TS-001", "packages/pbx-core/src/extension.ts", "ExtensionDraft.number must be ExtensionNumber");
  }
  const ivr = readSafe(path.join(coreSrc, "ivr/types.ts"));
  if (ivr && !/number:\s*IvrNumber/.test(ivr)) {
    fail(failures, "T-TS-001", "packages/pbx-core/src/ivr/types.ts", "IvrMenuDraft.number must be IvrNumber");
  }
}

function checkBrandBoundaryServices(root, failures) {
  const dir = path.join(root, "apps/web/src/server/services");
  for (const [name, re] of Object.entries(BRAND_BOUNDARY_SERVICES)) {
    const rel = `apps/web/src/server/services/${name}`;
    const text = readSafe(path.join(dir, name));
    if (!text) continue;
    if (!re.test(text)) {
      fail(
        failures,
        "T-TS-005",
        rel,
        `must call ${re.source.includes("Extension") ? "toExtensionDraft" : "toIvrMenuDraft"} after validate*`,
      );
    }
  }
}

function checkPjsipIniSanitize(root, failures) {
  const rel = "packages/pbx-core/src/pjsip.ts";
  const text = readSafe(path.join(root, rel));
  if (!text) return;
  if (!/sanitizeIniDisplayName/.test(text)) {
    fail(failures, "T-SEC-INI-001", rel, "must use sanitizeIniDisplayName from ini/sanitize");
  }
  if (/\.replace\(\s*\/"\/g/.test(text)) {
    fail(failures, "T-SEC-INI-001", rel, "replace(/\"/g) only sanitize forbidden");
  }
}

const PBX_WRITE_HANDLERS = {
  "extensions.ts": /PBX_CONFIG_WRITE_MIN_ROLE/,
  "guidance.ts": /PBX_CONFIG_WRITE_MIN_ROLE/,
};

function checkApiPbxWriteRole(root, failures) {
  const dir = path.join(root, "apps/web/src/server/api/handlers");
  for (const [name, re] of Object.entries(PBX_WRITE_HANDLERS)) {
    const rel = `apps/web/src/server/api/handlers/${name}`;
    const text = readSafe(path.join(dir, name));
    if (!re.test(text)) {
      fail(failures, "T-SEC-A01-001", rel, "PBX write must use PBX_CONFIG_WRITE_MIN_ROLE");
    }
  }
}

const SENSITIVE_API_AUDIT = {
  "recording.ts": "recording.read",
  "phonebook.ts": "phonebook.lookup",
  "devices.ts": "devices.stream",
};

function checkSensitiveApiAudit(root, failures) {
  const dir = path.join(root, "apps/web/src/server/api/handlers");
  for (const [name, action] of Object.entries(SENSITIVE_API_AUDIT)) {
    const rel = `apps/web/src/server/api/handlers/${name}`;
    const text = readSafe(path.join(dir, name));
    if (!text.includes(`'${action}'`) && !text.includes(`"${action}"`)) {
      fail(failures, "T-SEC-A09-001", rel, `must audit with ${action}`);
    }
  }
}

function checkSecurityHeadersSource(root, failures) {
  const rel = "apps/web/next.config.ts";
  const text = readSafe(path.join(root, rel));
  if (!/buildSecurityHeaders/.test(text)) {
    fail(failures, "T-SEC-HEADERS-001", rel, "must use buildSecurityHeaders from security-headers.ts");
  }
}

const POST_API_CSRF_ROUTES = [
  "apps/web/src/app/api/extensions/route.ts",
  "apps/web/src/app/api/originate/route.ts",
  "apps/web/src/app/api/guidances/route.ts",
  "apps/web/src/app/api/cdr/ingest/route.ts",
  "apps/web/src/app/api/patients/records/route.ts",
];

function checkAllPostApiCsrf(root, failures) {
  const apiRoot = path.join(root, "apps/web/src/app/api");
  if (!fs.existsSync(apiRoot)) return;
  function walk(dir) {
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, name.name);
      if (name.isDirectory()) walk(p);
      else if (name.name === "route.ts") {
        const rel = path.relative(root, p).replace(/\\/g, "/");
        const text = readSafe(p);
        if (/export\s+async\s+function\s+POST/.test(text) && !rel.includes("health/")) {
          if (!/rejectDisallowedPostOrigin/.test(text)) {
            fail(failures, "T-SEC-CSRF-003", rel, "POST route must call rejectDisallowedPostOrigin");
          }
        }
      }
    }
  }
  walk(apiRoot);
  checkPostApiCsrf(root, failures);
}

/** Keep in sync with packages/pbx-core/src/docker/from-pin.ts */
function collectDockerfileFromPinFailures(text) {
  const pinnedStages = new Set();
  const out = [];
  const digestFrom = /^FROM\s+.+\@sha256:[a-f0-9]{64}(\s+AS\s+(\S+))?/i;
  const stageFrom = /^FROM\s+(\S+)\s+AS\s+(\S+)/i;
  const isExternal = (name) => name.includes(":") || name.includes("/");
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!/^FROM\s+/i.test(line)) continue;
    const digest = digestFrom.exec(line);
    if (digest) {
      if (digest[2]) pinnedStages.add(digest[2].toLowerCase());
      continue;
    }
    const stage = stageFrom.exec(line);
    if (stage && !isExternal(stage[1]) && pinnedStages.has(stage[1].toLowerCase())) {
      pinnedStages.add(stage[2].toLowerCase());
      continue;
    }
    out.push(line);
  }
  return out;
}

function checkDockerfileDigestPin(root, failures) {
  for (const rel of ["asterisk/Dockerfile", "apps/web/Dockerfile"]) {
    const text = readSafe(path.join(root, rel));
    if (!text) continue;
    for (const line of collectDockerfileFromPinFailures(text)) {
      fail(failures, "T-SEC-IMG-002", rel, `FROM must pin digest: ${line}`);
    }
  }
}

function checkGithubActionsShaPin(root, failures) {
  const rel = ".github/workflows/ci.yml";
  const text = readSafe(path.join(root, rel));
  if (!text) return;
  for (const line of text.split("\n")) {
    const m = line.match(/uses:\s*([\w-]+\/[\w-]+)@([^\s#]+)/);
    if (!m) continue;
    const ref = m[2];
    if (!/^[a-f0-9]{40}$/.test(ref)) {
      fail(failures, "T-SEC-CI-001", rel, `uses must be SHA pin, got ${m[1]}@${ref}`);
    }
  }
}

function checkChromeExtensionManifestGate(root, failures) {
  const rel = "chrome-extension/manifest.json";
  const text = readSafe(path.join(root, rel));
  if (!text) return;
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch {
    fail(failures, "T-SEC-EXT-001", rel, "invalid JSON");
    return;
  }
  if (JSON.stringify(manifest.host_permissions ?? []).includes("*/*")) {
    fail(failures, "T-SEC-EXT-001", rel, "host_permissions must not use wildcard */*");
  }
  for (const cs of manifest.content_scripts ?? []) {
    for (const match of cs.matches ?? []) {
      if (/\*\/\*/.test(match)) {
        fail(failures, "T-SEC-EXT-001", rel, `content_scripts.matches wildcard forbidden: ${match}`);
      }
    }
  }
  for (const relJs of ["chrome-extension/background.js", "chrome-extension/options.js"]) {
    const js = readSafe(path.join(root, relJs));
    if (/chrome\.storage\.sync/.test(js)) {
      fail(failures, "T-SEC-EXT-002", relJs, "must use chrome.storage.local");
    }
  }
}

function checkChromeExtensionNoInnerHtml(root, failures) {
  for (const rel of ["chrome-extension/content.js", "chrome-extension/src/content-entry.ts"]) {
    const text = readSafe(path.join(root, rel));
    if (/\.innerHTML\s*=/.test(text)) {
      fail(failures, "T-SEC-EXT-003", rel, "content script must not assign innerHTML");
    }
  }
}

const SENSITIVE_API_RATE_LIMIT = {
  "phonebook.ts": ["phonebook-lookup", "rejectIfAppRateLimited"],
  "cdr.ts": ["cdr-export", "rejectIfAppRateLimited"],
  "patient-records.ts": ["patient-records", "rejectIfAppRateLimited"],
};

function checkSensitiveApiRateLimit(root, failures) {
  const dir = path.join(root, "apps/web/src/server/api/handlers");
  for (const [name, [scope, fn]] of Object.entries(SENSITIVE_API_RATE_LIMIT)) {
    const rel = `apps/web/src/server/api/handlers/${name}`;
    const text = readSafe(path.join(dir, name));
    if (!text.includes(fn)) {
      fail(failures, "T-SEC-RATE-002", rel, `must call ${fn}`);
    }
    if (!text.includes(scope)) {
      fail(failures, "T-SEC-RATE-002", rel, `must rate-limit scope ${scope}`);
    }
  }
}

function checkCspBuilderStrict(root, failures) {
  const rel = "packages/pbx-core/src/prod/content-security-policy.ts";
  const text = readSafe(path.join(root, rel));
  if (!/frame-ancestors/.test(text) || !/base-uri/.test(text) || !/form-action/.test(text)) {
    fail(failures, "T-SEC-CSP-001", rel, "must include frame-ancestors, base-uri, form-action");
  }
  if (/unsafe-inline/.test(text)) {
    fail(failures, "T-SEC-CSP-001", rel, "must not hardcode unsafe-inline in builder");
  }
}

function checkPostApiCsrf(root, failures) {
  for (const rel of POST_API_CSRF_ROUTES) {
    const text = readSafe(path.join(root, rel));
    if (!/rejectDisallowedPostOrigin/.test(text)) {
      fail(failures, "T-SEC-CSRF-001", rel, "POST route must call rejectDisallowedPostOrigin");
    }
  }
}

function checkCdrExportPipeline(root, failures) {
  const svc = "apps/web/src/server/services/cdr-export.ts";
  const svcText = readSafe(path.join(root, svc));
  if (!/renderCdrExportCsv/.test(svcText)) {
    fail(failures, "T-SEC-CSV-001", svc, "must use renderCdrExportCsv from @openpbx/core");
  }
  const handler = "apps/web/src/server/api/handlers/cdr.ts";
  const hText = readSafe(path.join(root, handler));
  if (!/buildCdrExportCsv/.test(hText)) {
    fail(failures, "T-SEC-CSV-001", handler, "CDR export must use buildCdrExportCsv service");
  }
}

function checkSessionRotateService(root, failures) {
  const rel = "apps/web/src/server/services/accounts.ts";
  const text = readSafe(path.join(root, rel));
  if (!/destroySessionsForAccount/.test(text)) {
    fail(failures, "T-SEC-SESSION-001", rel, "role update must destroySessionsForAccount");
  }
}

function checkOriginateAmiFields(root, failures) {
  const rel = "apps/web/src/server/api/handlers/originate.ts";
  const text = readSafe(path.join(root, rel));
  if (!/callerId/.test(text) || !/validateOriginateRequest/.test(text)) {
    fail(failures, "T-SEC-AMI-001", rel, "must pass callerId/context through validateOriginateRequest");
  }
}

const SENSITIVE_API_MIN_ROLE = {
  "recording.ts": "RECORDING_READ_MIN_ROLE",
  "devices.ts": "DEVICE_STREAM_MIN_ROLE",
};

function checkSensitiveApiMinRole(root, failures) {
  const dir = path.join(root, "apps/web/src/server/api/handlers");
  for (const [name, token] of Object.entries(SENSITIVE_API_MIN_ROLE)) {
    const rel = `apps/web/src/server/api/handlers/${name}`;
    const text = readSafe(path.join(dir, name));
    if (!text.includes(token) || !/withAuth/.test(text)) {
      fail(failures, "T-SEC-A01-002", rel, `must use withAuth and ${token}`);
    }
  }
}

const PJSIP_SYNC_PLACEHOLDER = "__OPENPBX_SYNC__";

function loadForbiddenTrackedPjsipPasswords(root) {
  const rel = "packages/pbx-core/forbidden-tracked-extension-passwords.json";
  try {
    return JSON.parse(readSafe(path.join(root, rel)));
  } catch {
    return [];
  }
}

function findForbiddenTrackedPjsipPasswords(iniText, forbiddenPasswords) {
  const hits = new Set();
  for (const line of iniText.split("\n")) {
    const m = line.match(/^\s*password\s*=\s*(\S+)\s*$/);
    if (!m) continue;
    const value = m[1].replace(/^["']|["']$/g, "");
    if (forbiddenPasswords.includes(value) || /^ext-dev-\d+$/.test(value)) {
      hits.add(value);
    }
  }
  return [...hits];
}

function checkPjsipInternalSrtp(root, failures) {
  const rel = "asterisk/pjsip.d/transports.conf";
  const text = readSafe(path.join(root, rel));
  if (!text) return;
  const block = text.match(/\[endpoint-internal\]\(!\)[\s\S]*?(?=\n\[|$)/);
  if (!block) {
    fail(failures, "T-SEC-RTP-001", rel, "missing [endpoint-internal](!) template");
    return;
  }
  for (const marker of ["media_encryption=sdes", "media_encryption_optimistic=no"]) {
    if (!block[0].includes(marker)) {
      fail(failures, "T-SEC-RTP-001", rel, `endpoint-internal must include ${marker}`);
    }
  }
}

function checkComposeWebPbxOutMount(root, failures) {
  const rel = "docker-compose.yml";
  const text = readSafe(path.join(root, rel));
  if (!text) return;
  const forbidden = [
    "./asterisk/pjsip.d:/asterisk/pjsip.d",
    "./asterisk/dialplan.d:/asterisk/dialplan.d",
  ];
  for (const f of forbidden) {
    if (text.includes(f)) {
      fail(failures, "T-SEC-MOUNT-001", rel, `web must not RW-mount git asterisk config: ${f}`);
    }
  }
  if (!text.includes("./data/pbx-out/pjsip.d:")) {
    fail(failures, "T-SEC-MOUNT-001", rel, "web/asterisk must use ./data/pbx-out/pjsip.d for generated config");
  }
}

function checkTrackedPjsipExtensionSecrets(root, failures) {
  const rel = "asterisk/pjsip.d/extensions.conf";
  const text = readSafe(path.join(root, rel));
  if (!text) return;
  const forbidden = findForbiddenTrackedPjsipPasswords(text, loadForbiddenTrackedPjsipPasswords(root));
  if (forbidden.length > 0) {
    fail(
      failures,
      "T-SEC-PJSIP-001",
      rel,
      `forbidden password= in tracked pjsip: ${forbidden.join(", ")}`,
    );
  }
  const passwords = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*password\s*=\s*(\S+)\s*$/);
    if (m) passwords.push(m[1].replace(/^["']|["']$/g, ""));
  }
  if (passwords.length > 0 && passwords.some((p) => p !== PJSIP_SYNC_PLACEHOLDER)) {
    fail(
      failures,
      "T-SEC-PJSIP-001",
      rel,
      "tracked extensions.conf must use password=__OPENPBX_SYNC__ only (bootstrap/infra sync)",
    );
  }
}

function checkAsteriskHttpLoopback(root, failures) {
  const rel = "asterisk/http.conf";
  const text = readSafe(path.join(root, rel));
  if (!text) return;
  const bind = text.match(/^\s*bindaddr\s*=\s*(\S+)/m)?.[1];
  const tls = text.match(/^\s*tlsbindaddr\s*=\s*(\S+)/m)?.[1];
  if (bind !== "127.0.0.1") {
    fail(failures, "T-SEC-A05-002", rel, "bindaddr must be 127.0.0.1");
  }
  if (tls && !tls.startsWith("127.0.0.1")) {
    fail(failures, "T-SEC-A05-002", rel, "tlsbindaddr must bind loopback only");
  }
}

function checkAsteriskImagePin(root, failures) {
  const rel = "asterisk/Dockerfile";
  const text = readSafe(path.join(root, rel));
  if (!text) return;
  if (!/ARG\s+ASTERISK_PKG_VERSION/.test(text) || !/asterisk=\$\{ASTERISK_PKG_VERSION\}/.test(text)) {
    fail(failures, "T-SEC-IMG-001", rel, "must pin asterisk via ASTERISK_PKG_VERSION");
  }
}

function checkDialplanShellSafety(root, failures) {
  const rel = "asterisk/extensions.conf";
  const text = readSafe(path.join(root, rel));
  if (!text) return;
  const systemLine = text.split("\n").find((l) => /System\(.*notify-event/.test(l)) ?? "";
  if (systemLine.includes("CALLERID(name)")) {
    fail(failures, "T-SEC-SHELL-001", rel, "System(notify-event) must use SAFE_CALLER_NAME not CALLERID(name)");
  }
  if (!/SAFE_CALLER_NAME/.test(text)) {
    fail(failures, "T-SEC-SHELL-001", rel, "must Set(SAFE_CALLER_NAME=...) before notify-event");
  }
}

function checkGuidanceCoreValidate(root, failures) {
  const rel = "apps/web/src/server/api/handlers/guidance.ts";
  const text = readSafe(path.join(root, rel));
  if (!/validateGuidanceName/.test(text) || !/validateWavHeader/.test(text)) {
    fail(failures, "T-SEC-A03-001", rel, "must validateGuidanceName/validateWavHeader from @openpbx/core");
  }
}

function runTsConventionChecks(root, rel, failures) {
  if (!rel) return;
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return;
  const text = readSafe(abs);
  if (rel.endsWith(".test.ts")) return;

  const inTsDirs = TS_CONVENTION_DIRS.some((d) => rel.startsWith(`${d}/`) || rel === d);
  if (inTsDirs) {
    if (/export\s+class\s+\w+/.test(text)) {
      fail(failures, "T-TS-003", rel, "export class forbidden");
    }
    if (/class\s+\w+\s+extends\s+Error/.test(text)) {
      fail(failures, "T-TS-003", rel, "class extends Error forbidden");
    }
    if (INSTANCEOF_CUSTOM_ERROR.test(text)) {
      fail(failures, "T-TS-004", rel, "instanceof custom *Error forbidden");
    }
    if (NEW_CUSTOM_ERROR.test(text)) {
      fail(failures, "T-TS-004", rel, "new CustomError() forbidden");
    }
  }

  if (rel.startsWith("packages/pbx-core/src/") && /export\s+type\s+\w+Draft\s*=\s*\{/.test(text)) {
    fail(failures, "T-TS-002", rel, "*Draft must be Readonly");
  }

  const base = path.basename(rel);
  if (rel.startsWith("apps/web/src/server/services/") && BRAND_BOUNDARY_SERVICES[base]) {
    if (!BRAND_BOUNDARY_SERVICES[base].test(text)) {
      fail(failures, "T-TS-005", rel, "must brand via to*Draft after validate*");
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
  if (rel.startsWith("apps/web/src/server/services/") && SERVICES_REQUIRE_CORE_VALIDATE.includes(path.basename(rel))) {
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
  runTsConventionChecks(root, rel, failures);
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
  checkNoExportClass(root, failures);
  checkNoInstanceofCustomErrors(root, failures);
  checkCoreDraftConventions(root, failures);
  checkBrandBoundaryServices(root, failures);
  checkPjsipIniSanitize(root, failures);
  checkApiPbxWriteRole(root, failures);
  checkSensitiveApiAudit(root, failures);
  checkSecurityHeadersSource(root, failures);
  checkAllPostApiCsrf(root, failures);
  checkCdrExportPipeline(root, failures);
  checkSessionRotateService(root, failures);
  checkOriginateAmiFields(root, failures);
  checkSensitiveApiMinRole(root, failures);
  checkGuidanceCoreValidate(root, failures);
  checkDialplanShellSafety(root, failures);
  checkTrackedPjsipExtensionSecrets(root, failures);
  checkComposeWebPbxOutMount(root, failures);
  checkPjsipInternalSrtp(root, failures);
  checkAsteriskHttpLoopback(root, failures);
  checkAsteriskImagePin(root, failures);
  checkDockerfileDigestPin(root, failures);
  checkGithubActionsShaPin(root, failures);
  checkChromeExtensionManifestGate(root, failures);
  checkChromeExtensionNoInnerHtml(root, failures);
  checkSensitiveApiRateLimit(root, failures);
  checkCspBuilderStrict(root, failures);
  return failures;
}
