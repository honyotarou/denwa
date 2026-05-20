import path from 'node:path';
import { getCdrRecord } from '@openpbx/db/repos/cdr';
import { ingestCdrFile } from '@openpbx/infra/cdr/ingest';
import type { AppContext } from '../../context';
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
