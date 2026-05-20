import type Database from 'better-sqlite3';
import { isForbiddenExtensionSecret, verifyPassword } from '@openpbx/core';
import { fail, pass, type ProdCheckFinding } from '@openpbx/core';

const DEFAULT_ADMIN_PASSWORD = ['admin', '-please', '-change'].join('');

export function runProdCheckDatabase(
  db: Database.Database,
  opts?: { acceptEmptyIpAllow?: boolean },
): readonly ProdCheckFinding[] {
  const findings: ProdCheckFinding[] = [];
  const acceptEmpty = opts?.acceptEmptyIpAllow ?? false;

  const admin = db
    .prepare(`SELECT password_hash FROM accounts WHERE username = 'admin' LIMIT 1`)
    .get() as { password_hash: string } | undefined;
  if (admin && verifyPassword(DEFAULT_ADMIN_PASSWORD, admin.password_hash)) {
    findings.push(fail('T-PROD-001', 'admin account still uses default password'));
  } else {
    findings.push(pass('T-PROD-001', 'admin password changed from default'));
  }

  const rows = db
    .prepare(`SELECT number, secret FROM extensions WHERE number IN ('1001','1002')`)
    .all() as Array<{ number: string; secret: string }>;
  const bad = rows.filter((r) => isForbiddenExtensionSecret(r.secret));
  if (bad.length) {
    findings.push(
      fail('T-PROD-005', `extensions still use default secrets: ${bad.map((r) => r.number).join(', ')}`),
    );
  }

  const ipCount = (db.prepare(`SELECT COUNT(*) AS c FROM ip_allow_list`).get() as { c: number }).c;
  if (ipCount === 0 && !acceptEmpty) {
    findings.push(
      fail('T-PROD-007', 'ip_allow_list is empty — configure CIDR allowlist for production'),
    );
  } else if (ipCount > 0) {
    findings.push(pass('T-PROD-007', 'ip_allow_list has entries'));
  } else {
    findings.push(
      pass('T-PROD-007', 'ip_allow_list empty explicitly accepted (acceptEmptyIpAllow)'),
    );
  }

  return findings;
}
