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

export function listAudit(db: Database.Database, limit = 50): Array<{ action: string; created_at: string }> {
  return db
    .prepare('SELECT action, created_at FROM audit_log ORDER BY id DESC LIMIT ?')
    .all(limit) as Array<{ action: string; created_at: string }>;
}

export function recordLoginAttempt(
  db: Database.Database,
  username: string,
  success: boolean,
): void {
  db.prepare(`INSERT INTO login_history (username, success) VALUES (?, ?)`).run(username, success ? 1 : 0);
}

export function listLoginHistory(
  db: Database.Database,
  limit = 50,
): Array<{ username: string; success: number; created_at: string }> {
  return db
    .prepare('SELECT username, success, created_at FROM login_history ORDER BY id DESC LIMIT ?')
    .all(limit) as Array<{ username: string; success: number; created_at: string }>;
}
