import type Database from 'better-sqlite3';
import {
  hashPassword,
  verifyPassword,
  validatePasswordAgainstPolicy,
  isIpAllowed,
  isValidCidr,
  generateSecret,
  verifyTotpConsuming,
} from '@openpbx/core';
import {
  createAccount,
  createSessionToken,
  destroySession,
  destroySessionsForAccount,
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
  getTotpLastCounter,
  setTotpLastCounter,
  deleteAccount,
  listIpAllow,
  recordAudit,
  recordLoginAttempt,
  upsertIpAllow,
  deleteIpAllow,
} from '@openpbx/db';
import {
  countRecentLoginFailures,
  countRecentLoginFailuresByIp,
  getLockoutPolicy,
} from '@openpbx/db/repos/login-lockout';
import { authError } from './auth-error';
import { isLoginLockedOut, LOGIN_LOCKOUT_WINDOW_MINUTES } from '@openpbx/core';

export type Role = 'user' | 'supervisor' | 'admin';
export type RequestMeta = Readonly<{ ip?: string; userAgent?: string }>;

export type SessionAccount = Readonly<{
  id: number;
  username: string;
  displayName: string | null;
  role: Role;
}>;

export { authError, isAuthError, type AuthError } from './auth-error';

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
    destroySessionsForAccount(accountId: number) {
      destroySessionsForAccount(db, accountId);
    },
    getAccountBySessionToken(token: string | null | undefined) {
      if (!token) return null;
      return getAccountBySessionToken(db, token) as SessionAccount | null;
    },
    requireAccount(token: string | null | undefined, meta?: RequestMeta): SessionAccount {
      if (token) {
        const allow = listIpAllow(db);
        if (!isIpAllowed(meta?.ip, allow)) {
          throw authError(403, 'IP not allowed');
        }
      }
      const a = this.getAccountBySessionToken(token);
      if (!a) throw authError(401, 'unauthorized');
      return a;
    },
    requireRole(token: string | null | undefined, meta: RequestMeta | undefined, ...roles: Role[]) {
      const a = this.requireAccount(token, meta);
      if (!roles.includes(a.role as Role)) throw authError(403, 'forbidden');
      return a;
    },
    requireMinRole(token: string | null | undefined, meta: RequestMeta | undefined, min: Role) {
      const a = this.requireAccount(token, meta);
      if (ROLE_RANK[a.role as Role] < ROLE_RANK[min]) throw authError(403, 'forbidden');
      return a;
    },
    recordAudit: (input: Parameters<typeof recordAudit>[1]) => recordAudit(db, input),
    recordLoginAttempt: (username: string, success: boolean, meta?: RequestMeta) =>
      recordLoginAttempt(db, username, success, meta),
    getLockoutPolicy: () => getLockoutPolicy(db),
    countRecentLoginFailures: (username: string) =>
      countRecentLoginFailures(db, username, LOGIN_LOCKOUT_WINDOW_MINUTES),
    countRecentLoginFailuresByIp: (ip: string | undefined) =>
      countRecentLoginFailuresByIp(db, ip, LOGIN_LOCKOUT_WINDOW_MINUTES),
    isLoginLocked: (username: string, ip?: string) => {
      const policy = getLockoutPolicy(db);
      const byUser = countRecentLoginFailures(db, username, policy.windowMinutes);
      const byIp = countRecentLoginFailuresByIp(db, ip, policy.windowMinutes);
      return (
        isLoginLockedOut(byUser, policy.threshold) || isLoginLockedOut(byIp, policy.threshold)
      );
    },
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
    verifyTotpCode(accountId: number, secret: string, code: string) {
      const last = getTotpLastCounter(db, accountId);
      const r = verifyTotpConsuming(secret, code, last);
      if (r.ok) {
        setTotpLastCounter(db, accountId, r.counter);
        return true;
      }
      return false;
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
