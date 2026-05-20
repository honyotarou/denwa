import fs from 'node:fs';
import path from 'node:path';

export type ProdCheckFinding = Readonly<{
  id: string;
  message: string;
  severity: 'fail' | 'pass';
}>;

export type ProdCheckResult = Readonly<{
  ok: boolean;
  findings: readonly ProdCheckFinding[];
}>;

export type ProdCheckInput = Readonly<{
  repoRoot: string;
}>;

const DEFAULT_EXTENSION_SECRETS = ['secret-1001', 'secret-1002'] as const;
const DEFAULT_AMI_SECRET = 'command-room-ami-secret';
const DEFAULT_SERVER_ACTION_KEY = '/RYJ01by2xFCY498hIqUlOMmCEG5Q/gqDZHfubOpZmA=';

function readFileOrEmpty(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

export function fail(id: string, message: string): ProdCheckFinding {
  return { id, message, severity: 'fail' };
}

export function pass(id: string, message: string): ProdCheckFinding {
  return { id, message, severity: 'pass' };
}

/** リポジトリ内の既定秘密・本番 cookie 契約（T-PROD-002〜006, 004） */
export function runProdCheckFiles(input: ProdCheckInput): ProdCheckResult {
  const root = input.repoRoot;
  const findings: ProdCheckFinding[] = [];

  const compose = readFileOrEmpty(path.join(root, 'docker-compose.yml'));
  const manager = readFileOrEmpty(path.join(root, 'asterisk/manager.conf'));
  const actionsTs = readFileOrEmpty(path.join(root, 'apps/web/src/app/actions.ts'));
  const pjsipSeed = readFileOrEmpty(path.join(root, 'asterisk/pjsip.d/extensions.conf'));
  const goldenPjsip = readFileOrEmpty(
    path.join(root, 'fixtures/golden/current/pjsip/extensions.conf'),
  );

  if (compose.includes(DEFAULT_AMI_SECRET) || manager.includes(DEFAULT_AMI_SECRET)) {
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

  const extSecretHit = DEFAULT_EXTENSION_SECRETS.some(
    (s) => pjsipSeed.includes(s) || goldenPjsip.includes(s) || compose.includes(s),
  );
  if (extSecretHit) {
    findings.push(
      fail('T-PROD-005', 'default extension secrets (secret-1001/1002) still in seed or compose'),
    );
  } else {
    findings.push(pass('T-PROD-005', 'extension secrets not using repository defaults in tracked files'));
  }

  if (/permit\s*=\s*172\.0\.0\.0\/255\.0\.0\.0/.test(manager)) {
    findings.push(fail('T-PROD-006', 'AMI permit still allows broad Docker bridge 172.0.0.0/8'));
  } else {
    findings.push(pass('T-PROD-006', 'AMI permit narrowed from default Docker range'));
  }

  const loginCookieBlock = actionsTs.includes("store.set('cr_session'")
    ? actionsTs.slice(actionsTs.indexOf("store.set('cr_session'"))
    : '';
  const hasSecureTrue = /secure:\s*true/.test(loginCookieBlock);
  const prodNodeEnv = /NODE_ENV:\s*production/.test(compose);
  if (prodNodeEnv && loginCookieBlock && !hasSecureTrue) {
    findings.push(
      fail('T-PROD-004', 'session cookie missing secure: true while NODE_ENV=production in compose'),
    );
  } else {
    findings.push(
      fail('T-PROD-004', 'session cookie must set secure: true for production deployments'),
    );
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
