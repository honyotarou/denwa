import type Database from 'better-sqlite3';

export function recordAudit(
  db: Database.Database,
  input: {
    actor?: string;
    action: string;
    target?: string;
    details?: unknown;
    ip?: string;
    userAgent?: string;
  },
): void {
  db.prepare(
    `INSERT INTO audit_log (actor, action, target, details, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    input.actor ?? null,
    input.action,
    input.target ?? null,
    input.details === undefined ? null : JSON.stringify(input.details),
    input.ip ?? null,
    input.userAgent ?? null,
  );
}

export function listAudit(
  db: Database.Database,
  limit = 50,
): Array<{
  action: string;
  created_at: string;
  actor: string | null;
  target: string | null;
  ip: string | null;
  details: string | null;
}> {
  return db
    .prepare(
      `SELECT action, created_at, actor, target, ip, details
       FROM audit_log ORDER BY id DESC LIMIT ?`,
    )
    .all(limit) as Array<{
    action: string;
    created_at: string;
    actor: string | null;
    target: string | null;
    ip: string | null;
    details: string | null;
  }>;
}

export function recordLoginAttempt(
  db: Database.Database,
  username: string,
  success: boolean,
  meta?: { ip?: string; userAgent?: string },
): void {
  db.prepare(`INSERT INTO login_history (username, success, ip, user_agent) VALUES (?, ?, ?, ?)`).run(
    username,
    success ? 1 : 0,
    meta?.ip ?? null,
    meta?.userAgent ?? null,
  );
}

export function listLoginHistory(
  db: Database.Database,
  limit = 50,
): Array<{
  username: string;
  success: number;
  created_at: string;
  ip: string | null;
  user_agent: string | null;
}> {
  return db
    .prepare(
      `SELECT username, success, created_at, ip, user_agent
       FROM login_history ORDER BY id DESC LIMIT ?`,
    )
    .all(limit) as Array<{
    username: string;
    success: number;
    created_at: string;
    ip: string | null;
    user_agent: string | null;
  }>;
}
