import type Database from 'better-sqlite3';
import { createInMemoryDb, seedExtensions } from '@openpbx/db';
import { createAuthService, type AuthService, type RequestMeta } from './auth.js';
import { createInfraSync, type InfraDirs, type InfraSync } from './infra-sync.js';

export type Role = 'user' | 'supervisor' | 'admin';

export type AppContext = {
  db: Database.Database;
  auth: AuthService;
  infra: InfraSync;
  sessionToken: string | null;
  meta: RequestMeta;
  infraDirs: InfraDirs;
};

export function createTestContext(opts?: {
  sessionToken?: string | null;
  meta?: Partial<RequestMeta>;
  infraDirs?: Partial<InfraDirs>;
}): AppContext {
  const db = createInMemoryDb({ seed: true });
  const infraDirs: InfraDirs = {
    pjsipDir: opts?.infraDirs?.pjsipDir ?? '/tmp/pbx-test/pjsip.d',
    dialplanDir: opts?.infraDirs?.dialplanDir ?? '/tmp/pbx-test/dialplan.d',
    signalDir: opts?.infraDirs?.signalDir ?? '/tmp/pbx-test/signals',
    soundsDir: opts?.infraDirs?.soundsDir ?? '/tmp/pbx-test/sounds',
    recordingsDir: opts?.infraDirs?.recordingsDir ?? '/tmp/pbx-test/recordings',
  };
  const meta: RequestMeta = {
    ip: opts?.meta?.ip ?? '127.0.0.1',
    userAgent: opts?.meta?.userAgent ?? 'vitest',
  };
  return {
    db,
    auth: createAuthService(db),
    infra: createInfraSync(db, infraDirs),
    sessionToken: opts?.sessionToken ?? null,
    meta,
    infraDirs,
  };
}

export async function loginAsAdmin(ctx: AppContext): Promise<string> {
  const { hashPassword } = await import('@openpbx/core');
  const { createAccount } = await import('@openpbx/db');
  seedExtensions(ctx.db);
  let acct = ctx.auth.getAccountByUsername('admin');
  if (!acct) {
    acct = ctx.auth.createAccount({
      username: 'admin',
      displayName: 'Admin',
      passwordHash: hashPassword('admin-please-change'),
      role: 'admin',
    });
  }
  return ctx.auth.createSession(acct.id, ctx.meta);
}
