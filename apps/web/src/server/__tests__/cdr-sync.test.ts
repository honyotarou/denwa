import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { applySchema } from '@openpbx/db';
import { syncCdrFromMasterCsv } from '../services/cdr-sync';

describe('T-CDR-SYNC-001: syncCdrFromMasterCsv', () => {
  it('Given Master.csv When sync Then cdr_records populated', async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'cdr-sync-'));
    const csv = path.join(base, 'Master.csv');
    const line =
      '"","1001","1002","internal","","","","Dial","","2026-05-20 20:25:28","","2026-05-20 20:25:34",6,0,"NO ANSWER","","","1779308728.0"\n';
    await fs.writeFile(csv, line);
    const db = new Database(':memory:');
    applySchema(db);
    const r = await syncCdrFromMasterCsv(db, csv);
    expect(r.ingested).toBe(1);
    const row = db
      .prepare('SELECT start_at, src, dst FROM cdr_records WHERE uniqueid = ?')
      .get('1779308728.0') as { start_at: string; src: string; dst: string };
    expect(row.src).toBe('1001');
    expect(row.start_at).toBe('2026-05-20 20:25:28');
  });

  it('Given 17 列 Master.csv と stale offset When sync Then 復旧して取り込む', async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'cdr-sync-17-'));
    const csv = path.join(base, 'Master.csv');
    const line =
      '"","1001","1002","internal","""Reception 1001"" <1001>","PJSIP/1001-00000000","PJSIP/1002-00000001","Dial","PJSIP/1002,30","2026-05-20 20:25:28",,"2026-05-20 20:25:34",6,0,"NO ANSWER","DOCUMENTATION","1779308728.0"\n';
    await fs.writeFile(csv, line);
    const db = new Database(':memory:');
    applySchema(db);
    const st = await fs.stat(csv);
    const { advanceCdrIngestOffset } = await import('@openpbx/db');
    advanceCdrIngestOffset(db, csv, st.ino, st.size);
    const r = await syncCdrFromMasterCsv(db, csv);
    expect(r.ingested).toBe(1);
    expect(
      db.prepare('SELECT uniqueid FROM cdr_records WHERE uniqueid = ?').get('1779308728.0'),
    ).toBeDefined();
  });
});
