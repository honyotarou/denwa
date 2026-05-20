import type Database from 'better-sqlite3';
import {
  hashPassword,
  verifyPassword,
  validatePasswordAgainstPolicy,
  isIpAllowed,
  isValidCidr,
  generateSecret,
  verifyTotp,
} from '@openpbx/core';
import {
  createAccount,
  createSessionToken,
  destroySession,
  getAccountById,
  getAccountBySessionToken,
  getAccountByUsername,
  getPasswordPolicy,
  listIpAllow,
  recordAudit,
  recordLoginAttempt,
  upsertIpAllow,
} from '@openpbx/db';

export type Role = 'user' | 'supervisor' | 'admin';
export type RequestMeta = Readonly<{ ip?: string; userAgent?: string }>;

export type SessionAccount = Readonly<{
  id: number;
  username: string;
  displayName: string | null;
  role: Role;
}>;

export class AuthError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

const ROLE_RANK: Record<Role, number> = { user: 1, supervisor: 2, admin: 3 };

export function createAuthService(db: Database.Database) {
  return {
    hashPassword,
    verifyPassword,
    createSession(accountId: number, meta?: RequestMeta) {
      return createSessionToken(db, accountId, { userAgent: meta?.userAgent, ip: meta?.ip });
    },
    destroySession(token: string) {
      destroySession(db, token);
    },
    getAccountBySessionToken(token: string | null | undefined) {
      if (!token) return null;
      return getAccountBySessionToken(db, token) as SessionAccount | null;
    },
    requireAccount(token: string | null | undefined, meta?: RequestMeta): SessionAccount {
      if (token) {
        const allow = listIpAllow(db);
        if (!isIpAllowed(meta?.ip, allow)) {
          throw new AuthError(403, 'IP not allowed');
        }
      }
      const a = this.getAccountBySessionToken(token);
      if (!a) throw new AuthError(401, 'unauthorized');
      return a;
    },
    requireRole(token: string | null | undefined, meta: RequestMeta | undefined, ...roles: Role[]) {
      const a = this.requireAccount(token, meta);
      if (!roles.includes(a.role as Role)) throw new AuthError(403, 'forbidden');
      return a;
    },
    requireMinRole(token: string | null | undefined, meta: RequestMeta | undefined, min: Role) {
      const a = this.requireAccount(token, meta);
      if (ROLE_RANK[a.role as Role] < ROLE_RANK[min]) throw new AuthError(403, 'forbidden');
      return a;
    },
    recordAudit: (input: Parameters<typeof recordAudit>[1]) => recordAudit(db, input),
    recordLoginAttempt: (username: string, success: boolean) =>
      recordLoginAttempt(db, username, success),
    getAccountByUsername: (u: string) => getAccountByUsername(db, u),
    getAccountById: (id: number) => getAccountById(db, id),
    createAccount: (input: Parameters<typeof createAccount>[1]) => createAccount(db, input),
    getPasswordHash(id: number): string | null {
      const row = db.prepare('SELECT password_hash FROM accounts WHERE id = ?').get(id) as
        | { password_hash: string }
        | undefined;
      return row?.password_hash ?? null;
    },
    setPasswordHash(id: number, hash: string) {
      db.prepare(`UPDATE accounts SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(
        hash,
        id,
      );
    },
    updateDisplayName(id: number, displayName: string | null) {
      db.prepare(`UPDATE accounts SET display_name = ?, updated_at = datetime('now') WHERE id = ?`).run(
        displayName,
        id,
      );
    },
    updateRole(id: number, role: Role) {
      db.prepare(`UPDATE accounts SET role = ?, updated_at = datetime('now') WHERE id = ?`).run(role, id);
    },
    countAdmins(excludeId?: number): number {
      const row = db
        .prepare(
          `SELECT COUNT(*) AS c FROM accounts WHERE role = 'admin' ${excludeId ? 'AND id != ?' : ''}`,
        )
        .get(...(excludeId ? [excludeId] : [])) as { c: number };
      return row.c;
    },
    getTotpSecret(id: number): string | null {
      const row = db.prepare('SELECT totp_secret FROM accounts WHERE id = ?').get(id) as
        | { totp_secret: string | null }
        | undefined;
      return row?.totp_secret ?? null;
    },
    setTotpSecret(id: number, secret: string | null) {
      db.prepare(`UPDATE accounts SET totp_secret = ?, updated_at = datetime('now') WHERE id = ?`).run(
        secret,
        id,
      );
    },
    validatePassword(plain: string): string[] {
      const p = getPasswordPolicy(db);
      return validatePasswordAgainstPolicy(plain, {
        minLength: p.minLength,
        requireLowercase: true,
        requireUppercase: false,
        requireDigit: p.requireDigit,
        requireSymbol: false,
      });
    },
    getPasswordPolicy: () => getPasswordPolicy(db),
    validateCidr: isValidCidr,
    listIpAllow: () => listIpAllow(db),
    upsertIpAllow: (cidr: string, note?: string) => upsertIpAllow(db, cidr, note),
    generateTotpSecret: generateSecret,
    verifyTotpCode: verifyTotp,
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
