import fs from 'node:fs';
import path from 'node:path';
import {
  fail,
  pass,
  type ProdCheckFinding,
  type ProdCheckResult,
} from '@openpbx/core';
import {
  findForbiddenTrackedExtensionPasswords,
} from '@openpbx/core';
import {
  composePublishesForbiddenAsteriskHttp,
  readComposeDraftFromFile,
} from '../docker/compose-file.js';

export type { ProdCheckFinding, ProdCheckResult } from '@openpbx/core';
export { fail, pass } from '@openpbx/core';

export type ProdCheckInput = Readonly<{
  repoRoot: string;
}>;

const DEFAULT_AMI_SECRET = ['command', '-room', '-ami', '-secret'].join('');
const DEFAULT_SERVER_ACTION_KEY = '/RYJ01by2xFCY498hIqUlOMmCEG5Q/gqDZHfubOpZmA=';

function readFileOrEmpty(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

/** リポジトリ内の既定秘密・本番 cookie 契約（T-PROD-002〜006, 004） */
export function runProdCheckFiles(input: ProdCheckInput): ProdCheckResult {
  const root = input.repoRoot;
  const findings: ProdCheckFinding[] = [];

  const compose = readFileOrEmpty(path.join(root, 'docker-compose.yml'));
  const manager = readFileOrEmpty(path.join(root, 'asterisk/manager.conf'));
  const managerTemplate = readFileOrEmpty(path.join(root, 'asterisk/manager.conf.template'));
  const managerText = manager + managerTemplate;
  const authActionsTs = readFileOrEmpty(path.join(root, 'apps/web/src/app/actions/auth.ts'));
  const sessionCookieTs = readFileOrEmpty(path.join(root, 'apps/web/src/server/session-cookie.ts'));
  const pjsipSeed = readFileOrEmpty(path.join(root, 'asterisk/pjsip.d/extensions.conf'));

  if (compose.includes(DEFAULT_AMI_SECRET) || managerText.includes(DEFAULT_AMI_SECRET)) {
    findings.push(fail('T-PROD-002', 'default AMI secret still present in compose or manager.conf'));
  } else {
    findings.push(pass('T-PROD-002', 'AMI secret not using repository default'));
  }

  if (compose.includes(DEFAULT_SERVER_ACTION_KEY)) {
    findings.push(
      fail('T-PROD-003', 'fixed NEXT_SERVER_ACTIONS_ENCRYPTION_KEY still in docker-compose.yml'),
    );
  } else {
    findings.push(pass('T-PROD-003', 'Server Action encryption key rotated from repo default'));
  }

  const forbiddenPjsip = findForbiddenTrackedExtensionPasswords(pjsipSeed);
  if (forbiddenPjsip.length > 0) {
    findings.push(
      fail(
        'T-PROD-005',
        `tracked pjsip.d/extensions.conf has forbidden passwords: ${forbiddenPjsip.join(', ')}`,
      ),
    );
  } else {
    findings.push(pass('T-PROD-005', 'extension secrets not using repository defaults in tracked files'));
  }

  if (/permit\s*=\s*172\.0\.0\.0\/255\.0\.0\.0/.test(managerText)) {
    findings.push(fail('T-PROD-006', 'AMI permit still allows broad Docker bridge 172.0.0.0/8'));
  } else {
    findings.push(pass('T-PROD-006', 'AMI permit narrowed from default Docker range'));
  }

  const loginCookieBlock = authActionsTs.includes("store.set('cr_session'")
    ? authActionsTs.slice(authActionsTs.indexOf("store.set('cr_session'"))
    : '';
  const hasSecureTrue =
    /secure:\s*true/.test(loginCookieBlock) ||
    (/sessionCookieOptions/.test(loginCookieBlock) &&
      /secure/.test(sessionCookieTs) &&
      /NODE_ENV\s*===\s*['"]production['"]/.test(sessionCookieTs));
  const prodNodeEnv = /NODE_ENV:\s*production/.test(compose);
  if (!loginCookieBlock) {
    findings.push(fail('T-PROD-004', 'session cookie block not found in apps/web/src/app/actions/auth.ts'));
  } else if (prodNodeEnv && !hasSecureTrue) {
    findings.push(
      fail('T-PROD-004', 'session cookie missing secure: true while NODE_ENV=production in compose'),
    );
  } else if (hasSecureTrue) {
    findings.push(pass('T-PROD-004', 'session cookie sets secure: true'));
  } else {
    findings.push(
      pass('T-PROD-004', 'dev compose — enable secure: true on session cookie before production'),
    );
  }

  const draft = readComposeDraftFromFile(root);
  const forbiddenHttp = composePublishesForbiddenAsteriskHttp(draft);
  if (forbiddenHttp.length > 0) {
    findings.push(
      fail(
        'T-SEC-A05-001',
        `Asterisk HTTP must not be published to host: ${forbiddenHttp.join(', ')}`,
      ),
    );
  } else {
    findings.push(pass('T-SEC-A05-001', 'Asterisk HTTP/ARI not published on docker-compose host ports'));
  }

  const failures = findings.filter((f) => f.severity === 'fail');
  return { ok: failures.length === 0, findings };
}

export function mergeProdCheckResults(...parts: ProdCheckResult[]): ProdCheckResult {
  const findings = parts.flatMap((p) => p.findings);
  const failures = findings.filter((f) => f.severity === 'fail');
  return { ok: failures.length === 0, findings };
}

export function formatProdCheckReport(result: ProdCheckResult): string {
  const lines = ['denwa prod-check', ''];
  for (const f of result.findings) {
    const tag = f.severity === 'fail' ? 'FAIL' : ' OK ';
    lines.push(`[${tag}] ${f.id}: ${f.message}`);
  }
  lines.push('', result.ok ? 'Result: PASS' : 'Result: FAIL (expected on repository defaults)');
  return lines.join('\n');
}

/** T-PROD-008: 001〜007 がすべて pass のときのみ pass */
export function prodCheckSecretsReady(findings: readonly ProdCheckFinding[]): ProdCheckFinding {
  const secretIds = new Set([
    'T-PROD-001',
    'T-PROD-002',
    'T-PROD-003',
    'T-PROD-004',
    'T-PROD-005',
    'T-PROD-006',
    'T-PROD-007',
  ]);
  const secretFails = findings.filter((f) => f.severity === 'fail' && secretIds.has(f.id));
  if (secretFails.length === 0) {
    return pass('T-PROD-008', 'no default-secret findings');
  }
  return fail('T-PROD-008', 'secrets not production-ready (resolve T-PROD-001〜007 first)');
}
