import { describe, expect, it, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { applySchema } from '../apply-schema.js';
import {
  listDueUnappliedUpgrades,
  markUpgradeApplied,
  scheduleVersionUpgrade,
} from '../repos/version-upgrades.js';

describe('T-UPG-DB-001: applied_at', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    applySchema(db);
  });

  it('Given past schedule When listDueUnapplied Then row', () => {
    scheduleVersionUpgrade(db, {
      scheduledAt: '2020-01-01T00:00:00Z',
      asteriskImage: 'ast:1',
    });
    const due = listDueUnappliedUpgrades(db, '2026-01-01T00:00:00Z');
    expect(due).toHaveLength(1);
    expect(markUpgradeApplied(db, due[0]!.id)).toBe(true);
    expect(listDueUnappliedUpgrades(db, '2026-01-01T00:00:00Z')).toHaveLength(0);
  });
});
