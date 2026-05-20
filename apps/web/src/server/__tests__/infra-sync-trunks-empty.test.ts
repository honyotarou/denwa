import { describe, expect, it, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { isLegacyTrunkPlaceholder } from '@openpbx/core';
import { applySchema } from '@openpbx/db';
import { createInfraSync } from '../infra-sync';

describe('T-TRUNK-EMPTY-002: infra-sync empty trunks', () => {
  let db: Database.Database;
  let dirs: {
    pjsipDir: string;
    dialplanDir: string;
    signalDir: string;
    soundsDir: string;
    recordingsDir: string;
  };

  beforeEach(async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'denwa-trunk-'));
    db = new Database(':memory:');
    applySchema(db);
    dirs = {
      pjsipDir: path.join(base, 'pjsip'),
      dialplanDir: path.join(base, 'dialplan'),
      signalDir: path.join(base, 'signals'),
      soundsDir: path.join(base, 'sounds'),
      recordingsDir: path.join(base, 'rec'),
    };
    await fs.mkdir(dirs.pjsipDir, { recursive: true });
  });

  it('Given no trunks When syncTrunks Then empty conf not legacy placeholder', async () => {
    const infra = createInfraSync(db, dirs);
    await infra.syncTrunks();
    const conf = await fs.readFile(path.join(dirs.pjsipDir, 'trunks.conf'), 'utf8');
    expect(isLegacyTrunkPlaceholder(conf)).toBe(false);
    expect(conf).toContain('no SIP trunks');
  });
});
