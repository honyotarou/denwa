import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import {
  advanceCdrIngestOffset,
  applySchema,
  assertSchemaContract,
  captureSchemaSnapshot,
  createAccount,
  createExtension,
  createInMemoryDb,
  createIvrMenu,
  getIvrMenu,
  createPickupGroup,
  createRingGroup,
  createSessionToken,
  createSipTrunk,
  createTimeRule,
  deleteExtension,
  deleteRingGroup,
  deleteSipTrunk,
  deleteVersionUpgrade,
  isDuplicateError,
  EXPECTED_TABLES,
  getAccountBySessionToken,
  getAccountBySessionTokenIncludingExpired,
  getCdrIngestState,
  getCdrRecord,
  getConcurrencySnapshot,
  getExtension,
  getPasswordPolicy,
  getPickupGroupByName,
  getRingGroup,
  listAudit,
  listExtensions,
  listLoginHistory,
  listVersionUpgrades,
  migrateExtensions,
  reconcileCdrIngestOffset,
  resolveIngestOffset,
  scheduleVersionUpgrade,
  seedExtensions,
  updateExtension,
  updatePickupGroup,
  updateRingGroup,
  upsertBillingRate,
  upsertCdrRecord,
  upsertGuidance,
  upsertHoliday,
  upsertIpAllow,
  upsertSipTrunk,
  upsertConcurrencySnapshot,
  createPhonebookEntry,
  searchPhonebook,
  deletePhonebookEntry,
  recordAudit,
  recordLoginAttempt,
} from '../index.js';

function expectDuplicateError(fn: () => void): void {
  let err: unknown;
  try {
    fn();
  } catch (e) {
    err = e;
  }
  expect(isDuplicateError(err)).toBe(true);
}

const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../fixtures');
const SCHEMA_SNAPSHOT = path.join(FIXTURES, 'schema-normalized.json');

function legacyExtensionsDb(): Database.Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE extensions (
      number TEXT PRIMARY KEY,
      display_name TEXT,
      secret TEXT NOT NULL DEFAULT '',
      note TEXT
    );
    INSERT INTO extensions (number, display_name, secret, note) VALUES ('1001', 'Legacy', 'old-secret', NULL);
  `);
  return db;
}

describe('Phase 3 — @openpbx/db (T-DB-001〜026)', () => {
  describe('T-DB-001: applySchema tables', () => {
    it('Given empty db When applySchema Then all tables exist', () => {
      const db = createInMemoryDb();
      const tables = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`)
        .all() as Array<{ name: string }>;
      const names = new Set(tables.map((t) => t.name));
      for (const t of EXPECTED_TABLES) {
        expect(names.has(t), `missing ${t}`).toBe(true);
      }
    });
  });

  describe('T-DB-002: indexes and FK', () => {
    it('Given empty db When applySchema Then required index/FK contract', () => {
      const db = createInMemoryDb();
      expect(assertSchemaContract(db)).toEqual([]);
    });
  });

  describe('T-DB-003: legacy migrate', () => {
    it('Given legacy fixture When migrate Then missing columns added idempotently', () => {
      const db = legacyExtensionsDb();
      migrateExtensions(db);
      const cols = (
        db.prepare('PRAGMA table_info(extensions)').all() as Array<{ name: string }>
      ).map((c) => c.name);
      expect(cols).toContain('webrtc');
      expect(cols).toContain('updated_at');
      migrateExtensions(db);
      expect(cols).toContain('webrtc');
    });
  });

  describe('T-DB-004: seed', () => {
    it('Given empty db When seedExtensions Then 1001/1002/1003', () => {
      const db = createInMemoryDb();
      seedExtensions(db);
      expect(listExtensions(db).map((e) => e.number).sort()).toEqual(['1001', '1002', '1003']);
    });
  });

  describe('T-DB-005: extensions repo', () => {
    it('Given repo When create/update/delete Then constraints handled', () => {
      const db = createInMemoryDb();
      seedExtensions(db);
      createExtension(db, { number: '2001', secret: 'secret-2001' });
      expectDuplicateError(() => createExtension(db, { number: '2001', secret: 'x' }));
      updateExtension(db, { number: '2001', secret: 'new-secret' });
      expect(getExtension(db, '2001')!.secret).toBe('new-secret');
      expect(deleteExtension(db, '2001')).toBe(true);
    });
  });

  describe('T-DB-006: ring_groups', () => {
    it('Given repo When upsert members Then CASCADE and priority', () => {
      const db = createInMemoryDb();
      createRingGroup(db, { number: '6001', members: ['1001', '1002'] });
      let g = getRingGroup(db, '6001')!;
      expect(g.members).toEqual(['1001', '1002']);
      updateRingGroup(db, { number: '6001', members: ['1002'] });
      g = getRingGroup(db, '6001')!;
      expect(g.members).toEqual(['1002']);
      deleteRingGroup(db, '6001');
      expect(db.prepare('SELECT COUNT(*) AS c FROM ring_group_members').get()).toEqual({ c: 0 });
    });
  });

  describe('T-DB-007: pickup', () => {
    it('Given repo When upsert members Then CASCADE', () => {
      const db = createInMemoryDb();
      createPickupGroup(db, 'sales', ['1001']);
      updatePickupGroup(db, 'sales', ['1002']);
      expect(getPickupGroupByName(db, 'sales')!.members).toEqual(['1002']);
      db.prepare('DELETE FROM pickup_groups WHERE name = ?').run('sales');
      expect(db.prepare('SELECT COUNT(*) AS c FROM pickup_group_members').get()).toEqual({ c: 0 });
    });
  });

  describe('T-DB-008: phonebook', () => {
    it('Given repo When CRUD/search Then indexed lookup works', () => {
      const db = createInMemoryDb();
      const row = createPhonebookEntry(db, { name: 'Clinic', number: '0312345678' });
      const hits = searchPhonebook(db, 'Clinic');
      expect(hits.some((h) => h.id === row.id)).toBe(true);
      expect(deletePhonebookEntry(db, row.id)).toBe(true);
    });
  });

  describe('T-DB-009: holidays/time_rules', () => {
    it('Given repo When CRUD Then unique constraints', () => {
      const db = createInMemoryDb();
      upsertHoliday(db, '2026-01-01', 'New Year');
      upsertHoliday(db, '2026-01-01', 'NY');
      expect(db.prepare('SELECT name FROM holidays WHERE date = ?').get('2026-01-01')).toEqual({
        name: 'NY',
      });
      createTimeRule(db, { name: 'weekday' });
      expectDuplicateError(() => createTimeRule(db, { name: 'weekday' }));
    });
  });

  describe('T-DB-010: ivr', () => {
    it('Given repo When menu + options Then PK(menu,digit)', () => {
      const db = createInMemoryDb();
      createIvrMenu(db, {
        number: '9000',
        options: [{ digit: '1', action: 'goto', target: '9001', label: null }],
      });
      expect(getIvrMenu(db, '9000')!.options[0]!.digit).toBe('1');
    });
  });

  describe('T-DB-011: guidances', () => {
    it('Given repo When upsert/delete Then name PK', () => {
      const db = createInMemoryDb();
      upsertGuidance(db, { name: 'welcome', text: 'hello' });
      upsertGuidance(db, { name: 'welcome', text: 'updated' });
      expect(db.prepare('SELECT text FROM guidances WHERE name = ?').get('welcome')).toEqual({
        text: 'updated',
      });
    });
  });

  describe('T-DB-012: cdr upsert', () => {
    it('Given repo When upsert uniqueid Then update works', () => {
      const db = createInMemoryDb();
      upsertCdrRecord(db, { uniqueid: 'u1', src: '1001', disposition: 'ANSWERED' });
      upsertCdrRecord(db, { uniqueid: 'u1', src: '1002', disposition: 'BUSY' });
      expect(getCdrRecord(db, 'u1')!.src).toBe('1002');
    });
  });

  describe('T-DB-013: cdr_ingest offset monotonic', () => {
    it('Given state When advance Then offset increases', () => {
      const db = createInMemoryDb();
      advanceCdrIngestOffset(db, '/tmp/Master.csv', 1, 100);
      expect(getCdrIngestState(db).offset).toBe(100);
      expect(() => advanceCdrIngestOffset(db, '/tmp/Master.csv', 1, 50)).toThrow();
    });
  });

  describe('T-DB-014: inode changed', () => {
    it('Given inode change When resolve Then offset resets', () => {
      const db = createInMemoryDb();
      advanceCdrIngestOffset(db, '/tmp/Master.csv', 1, 500);
      const offset = resolveIngestOffset(db, '/tmp/Master.csv', 2, 1000);
      expect(offset).toBe(0);
    });
  });

  describe('T-DB-014b: reconcile stale ingest', () => {
    it('Given EOF offset and 0 cdr_records When reconcile Then offset 0', () => {
      const db = createInMemoryDb();
      advanceCdrIngestOffset(db, '/tmp/Master.csv', 1, 500);
      const offset = reconcileCdrIngestOffset(db, '/tmp/Master.csv', 1, 500);
      expect(offset).toBe(0);
      expect(getCdrIngestState(db).offset).toBe(0);
    });
  });

  describe('T-DB-015: accounts unique', () => {
    it('Given repo When duplicate username Then error', () => {
      const db = createInMemoryDb();
      createAccount(db, { username: 'alice', passwordHash: 'hash' });
      expectDuplicateError(() => createAccount(db, { username: 'alice', passwordHash: 'hash2' }));
    });
  });

  describe('T-DB-016: sessions', () => {
    it('Given valid/expired token When lookup Then account or null', () => {
      const db = createInMemoryDb();
      const acct = createAccount(db, { username: 'bob', passwordHash: 'h' });
      const token = createSessionToken(db, acct.id);
      expect(getAccountBySessionToken(db, token)?.username).toBe('bob');
      db.prepare(`UPDATE sessions SET expires_at = datetime('now', '-1 hour') WHERE token = ?`).run(token);
      expect(getAccountBySessionToken(db, token)).toBeNull();
      expect(getAccountBySessionTokenIncludingExpired(db, token)?.username).toBe('bob');
    });
  });

  describe('T-DB-017: audit/login_history', () => {
    it('Given inserts When list Then created desc', () => {
      const db = createInMemoryDb();
      recordAudit(db, { action: 'a.first' });
      recordAudit(db, { action: 'a.second' });
      recordLoginAttempt(db, 'u', true);
      expect(listAudit(db, 1)[0]!.action).toBe('a.second');
      expect(listLoginHistory(db, 1)[0]!.username).toBe('u');
    });
  });

  describe('T-DB-018: password_policies bootstrap', () => {
    it('Given applySchema When getPolicy Then id=1', () => {
      const db = createInMemoryDb();
      expect(getPasswordPolicy(db).id).toBe(1);
    });
  });

  describe('T-DB-019: ip_allow_list', () => {
    it('Given repo When CRUD Then cidr PK', () => {
      const db = createInMemoryDb();
      upsertIpAllow(db, '10.0.0.0/8', 'lan');
      upsertIpAllow(db, '10.0.0.0/8', 'updated');
      expect(db.prepare('SELECT note FROM ip_allow_list WHERE cidr = ?').get('10.0.0.0/8')).toEqual({
        note: 'updated',
      });
    });
  });

  describe('T-DB-020: billing_rates', () => {
    it('Given repo When upsert Then prefix unique', () => {
      const db = createInMemoryDb();
      upsertBillingRate(db, { prefix: '03', perMin: 8 });
      upsertBillingRate(db, { prefix: '03', perMin: 9 });
      expect(db.prepare('SELECT per_min FROM billing_rates WHERE prefix = ?').get('03')).toEqual({
        per_min: 9,
      });
    });
  });

  describe('T-DB-021: concurrency_snapshots', () => {
    it('Given repo When upsert Then max channels kept', () => {
      const db = createInMemoryDb();
      upsertConcurrencySnapshot(db, '2026-05-20T10:00', 3);
      upsertConcurrencySnapshot(db, '2026-05-20T10:00', 5);
      expect(getConcurrencySnapshot(db, '2026-05-20T10:00')).toBe(5);
    });
  });

  describe('T-DB-022: version_upgrades UTC', () => {
    it('Given schedule When read back Then scheduled_at stored', () => {
      const db = createInMemoryDb();
      const utc = '2026-06-01T03:00:00.000Z';
      const row = scheduleVersionUpgrade(db, { scheduledAt: utc, asteriskImage: 'ubuntu:22.04' });
      expect(listVersionUpgrades(db)[0]!.scheduledAt).toBe(utc);
      deleteVersionUpgrade(db, row.id);
    });
  });

  describe('T-DB-023: sip_trunks', () => {
    it('Given repo When CRUD Then name unique', () => {
      const db = createInMemoryDb();
      createSipTrunk(db, { name: 'carrier-a', host: 'sip.example.com' });
      expectDuplicateError(() => createSipTrunk(db, { name: 'carrier-a', host: 'other' }));
      upsertSipTrunk(db, { name: 'carrier-a', host: 'updated.example.com' });
      expect(deleteSipTrunk(db, 'carrier-a')).toBe(true);
    });
  });

  describe('T-DB-024: transaction rollback', () => {
    it('Given failing txn When write Then rollback', () => {
      const db = createInMemoryDb();
      expect(() => {
        const run = db.transaction(() => {
          createExtension(db, { number: '3001', secret: 'secret-3001' });
          throw new Error('abort');
        });
        run();
      }).toThrow('abort');
      expect(getExtension(db, '3001')).toBeNull();
    });
  });

  describe('T-DB-025: schema snapshot', () => {
    it('Given applySchema When capture Then matches approved snapshot', () => {
      const db = createInMemoryDb();
      const actual = captureSchemaSnapshot(db);
      const expected = JSON.parse(fs.readFileSync(SCHEMA_SNAPSHOT, 'utf8'));
      expect(actual).toEqual(expected);
    });
  });

  describe('T-DB-026: non-destructive migration', () => {
    it('Given production-like db When applySchema twice Then rows preserved', () => {
      const db = new Database(':memory:');
      applySchema(db);
      createAccount(db, { username: 'keep', passwordHash: 'x' });
      db.prepare(`INSERT INTO extensions (number, secret, webrtc, updated_at) VALUES ('9999', 's', 0, datetime('now'))`).run();
      const before = db.prepare('SELECT COUNT(*) AS c FROM accounts').get() as { c: number };
      applySchema(db);
      const after = db.prepare('SELECT COUNT(*) AS c FROM accounts').get() as { c: number };
      expect(after.c).toBe(before.c);
      expect(getExtension(db, '9999')?.number).toBe('9999');
    });
  });
});
