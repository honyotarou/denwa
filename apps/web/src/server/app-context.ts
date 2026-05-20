import Database from 'better-sqlite3';
import path from 'node:path';
import { applySchema } from '@openpbx/db';
import { createAuthService } from './auth.js';
import { createInfraSync, type InfraDirs } from './infra-sync.js';
import type { AppContext } from './context.js';

let dbSingleton: Database.Database | null = null;

export function getAppDb(): Database.Database {
  if (!dbSingleton) {
    const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data/db/command-room.sqlite');
    dbSingleton = new Database(file);
    applySchema(dbSingleton);
  }
  return dbSingleton;
}

function defaultDirs(): InfraDirs {
  return {
    pjsipDir: process.env.PJSIP_OUT_DIR ?? path.join(process.cwd(), 'asterisk/pjsip.d'),
    dialplanDir: process.env.DIALPLAN_OUT_DIR ?? path.join(process.cwd(), 'asterisk/dialplan.d'),
    signalDir: process.env.ASTERISK_SIGNAL_DIR ?? path.join(process.cwd(), 'data/signals'),
    soundsDir: process.env.SOUNDS_DIR ?? path.join(process.cwd(), 'asterisk/sounds'),
    recordingsDir: process.env.RECORDINGS_DIR ?? path.join(process.cwd(), 'data/recordings'),
  };
}

export function buildContext(sessionToken: string | null, meta?: { ip?: string }): AppContext {
  const db = getAppDb();
  const infraDirs = defaultDirs();
  return {
    db,
    auth: createAuthService(db),
    infra: createInfraSync(db, infraDirs),
    sessionToken,
    meta: { ip: meta?.ip ?? '127.0.0.1', userAgent: 'command-room-web' },
    infraDirs,
  };
}

export function sessionTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(/(?:^|;\s*)cr_session=([^;]+)/);
  return m ? m[1]! : null;
}
