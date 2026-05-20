import path from 'node:path';
import { getCdrRecord } from '@openpbx/db/repos/cdr';
import { ingestCdrFile } from '@openpbx/infra/cdr/ingest';
import type { AppContext } from '../../context';
import { buildCdrExportCsv } from '../../services/cdr-export.js';
import type { JsonHandlerResult } from '../types';
import { withAuth } from '../with-auth';

export async function handleCdrIngestPost(ctx: AppContext): Promise<JsonHandlerResult> {
  return withAuth(
    ctx,
    async () => {
      const csvPath =
        process.env.CDR_CSV_PATH ?? path.join(ctx.infraDirs.recordingsDir, '../asterisk-cdr/Master.csv');
      const r = await ingestCdrFile(ctx.db, csvPath);
      return { status: 200, body: r };
    },
    { minRole: 'supervisor' },
  );
}

export function getCdr(ctx: AppContext, uniqueid: string) {
  return getCdrRecord(ctx.db, uniqueid);
}

export async function handleCdrExportGet(ctx: AppContext): Promise<JsonHandlerResult> {
  return withAuth(
    ctx,
    (me) => {
      ctx.auth.recordAudit({
        actor: me.username,
        action: 'cdr.export',
        target: 'csv',
        ip: ctx.meta.ip,
        userAgent: ctx.meta.userAgent,
      });
      const csv = buildCdrExportCsv(ctx.db);
      return {
        status: 200,
        body: csv,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="cdr-export.csv"',
        },
      };
    },
    { minRole: 'supervisor' },
  );
}
