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
  getPasswordHash,
  setPasswordHash,
  updateAccountDisplayName,
  updateAccountRole,
  countAdmins,
  getTotpSecret,
  setTotpSecret,
  deleteAccount,
  listIpAllow,
  recordAudit,
  recordLoginAttempt,
  upsertIpAllow,
  deleteIpAllow,
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
    getPasswordHash: (id: number) => getPasswordHash(db, id),
    setPasswordHash: (id: number, hash: string) => setPasswordHash(db, id, hash),
    updateDisplayName: (id: number, displayName: string | null) =>
      updateAccountDisplayName(db, id, displayName),
    updateRole: (id: number, role: Role) => updateAccountRole(db, id, role),
    countAdmins: (excludeId?: number) => countAdmins(db, excludeId),
    getTotpSecret: (id: number) => getTotpSecret(db, id),
    setTotpSecret: (id: number, secret: string | null) => setTotpSecret(db, id, secret),
    deleteAccount: (id: number) => deleteAccount(db, id),
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
    deleteIpAllow: (cidr: string) => deleteIpAllow(db, cidr),
    generateTotpSecret: generateSecret,
    verifyTotpCode: verifyTotp,
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
