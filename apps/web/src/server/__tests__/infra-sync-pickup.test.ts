import { describe, expect, it, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { applySchema, createExtension, createPickupGroup } from '@openpbx/db';
import { createInfraSync } from '../infra-sync';

describe('T-PJSIP-PICKUP-001: infra-sync pickup groups', () => {
  let db: Database.Database;
  let dirs: { pjsipDir: string; dialplanDir: string; signalDir: string; soundsDir: string; recordingsDir: string };

  beforeEach(async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'denwa-sync-'));
    db = new Database(':memory:');
    applySchema(db);
    createExtension(db, { number: '1001', secret: 'secret-1001-ab' });
    createPickupGroup(db, 'sales', ['1001']);
    dirs = {
      pjsipDir: path.join(base, 'pjsip'),
      dialplanDir: path.join(base, 'dialplan'),
      signalDir: path.join(base, 'signals'),
      soundsDir: path.join(base, 'sounds'),
      recordingsDir: path.join(base, 'rec'),
    };
    await fs.mkdir(dirs.pjsipDir, { recursive: true });
  });

  it('Given pickup member When syncPjsipExtensions Then named_pickup_group in conf', async () => {
    const infra = createInfraSync(db, dirs);
    await infra.syncPjsipExtensions();
    const conf = await fs.readFile(path.join(dirs.pjsipDir, 'extensions.conf'), 'utf8');
    expect(conf).toContain('named_pickup_group=sales');
    expect(conf).toContain('named_call_group=sales');
  });
});
