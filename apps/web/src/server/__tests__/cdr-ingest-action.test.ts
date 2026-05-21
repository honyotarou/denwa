import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createTestContext, loginAsAdmin } from '../context';
import { ingestCdrNowWithAudit } from '../services/cdr-ingest';

describe('T-CDR-ACT-001: ingestCdrNowWithAudit', () => {
  it('Given csv When ingest Then cdr_records', async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'cdr-act-'));
    const csv = path.join(base, 'Master.csv');
    const line =
      '"","1001","1002","internal","","","","Dial","","2026-05-20 20:25:28",,"2026-05-20 20:25:34",6,0,"NO ANSWER","DOCUMENTATION","uid-act.0"\n';
    await fs.writeFile(csv, line);
    const ctx = createTestContext();
    ctx.sessionToken = await loginAsAdmin(ctx);
    const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
    const prev = process.env.CDR_CSV_PATH;
    process.env.CDR_CSV_PATH = csv;
    try {
      const r = await ingestCdrNowWithAudit(ctx, me);
      expect(r.ingested).toBe(1);
      const row = ctx.db
        .prepare('SELECT uniqueid FROM cdr_records WHERE uniqueid = ?')
        .get('uid-act.0');
      expect(row).toBeDefined();
    } finally {
      if (prev === undefined) delete process.env.CDR_CSV_PATH;
      else process.env.CDR_CSV_PATH = prev;
    }
  });
});
