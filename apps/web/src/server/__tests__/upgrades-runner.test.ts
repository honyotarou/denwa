import { describe, expect, it, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { applySchema, listDueUnappliedUpgrades, scheduleVersionUpgrade } from '@openpbx/db';
import { processDueUpgrades } from '../services/upgrades-runner';

describe('T-UPG-RUN-001', () => {
  let db: Database.Database;
  let root: string;
  let signalDir: string;

  beforeEach(async () => {
    db = new Database(':memory:');
    applySchema(db);
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'denwa-upg-'));
    signalDir = path.join(root, 'signals');
    scheduleVersionUpgrade(db, {
      scheduledAt: '2020-01-01T00:00:00Z',
      asteriskImage: 'ast:9',
    });
  });

  it('Given autoExec + mock spawn When process Then applied', async () => {
    const spawn = () => ({ status: 0, stdout: 'ok', stderr: '' });
    const n = await processDueUpgrades({
      db,
      repoRoot: root,
      signalDir,
      nowIso: '2026-01-01T00:00:00Z',
      autoExec: true,
      spawn,
    });
    expect(n).toBe(1);
    expect(listDueUnappliedUpgrades(db, '2026-01-01T00:00:00Z')).toHaveLength(0);
    const sig = await fs.readFile(path.join(signalDir, 'upgrade-run'), 'utf8');
    expect(sig).toContain('upgradeId');
  });
});
