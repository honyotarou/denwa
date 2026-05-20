import type Database from 'better-sqlite3';

export type LockoutPolicy = Readonly<{
  threshold: number;
  windowMinutes: number;
}>;

export function getLockoutPolicy(db: Database.Database): LockoutPolicy {
  const row = db
    .prepare('SELECT lockout_threshold FROM password_policies WHERE id = 1')
    .get() as { lockout_threshold: number } | undefined;
  return {
    threshold: row?.lockout_threshold ?? 5,
    windowMinutes: 15,
  };
}

export function countRecentLoginFailures(
  db: Database.Database,
  username: string,
  windowMinutes: number,
): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS c FROM login_history
       WHERE username = ? AND success = 0
         AND datetime(created_at) > datetime('now', ?)`,
    )
    .get(username, `-${windowMinutes} minutes`) as { c: number };
  return row.c;
}

export function countRecentLoginFailuresByIp(
  db: Database.Database,
  ip: string | undefined,
  windowMinutes: number,
): number {
  if (!ip) return 0;
  const row = db
    .prepare(
      `SELECT COUNT(*) AS c FROM login_history
       WHERE ip = ? AND success = 0
         AND datetime(created_at) > datetime('now', ?)`,
    )
    .get(ip, `-${windowMinutes} minutes`) as { c: number };
  return row.c;
}
