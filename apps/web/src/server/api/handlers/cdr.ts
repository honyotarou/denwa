import { getCdrRecord } from '@openpbx/db/repos/cdr';
import { rateLimitKeyForSessionToken } from '@openpbx/core';
import type { AppContext } from '../../context';
import { buildCdrExportCsv } from '../../services/cdr-export.js';
import { ingestCdrNowWithAudit } from '../../services/cdr-ingest.js';
import type { JsonHandlerResult } from '../types';
import { rejectIfAppRateLimited } from '../../services/app-rate-limit';
import { withAuth } from '../with-auth';

export async function handleCdrIngestPost(ctx: AppContext): Promise<JsonHandlerResult> {
  return withAuth(
    ctx,
    async (me) => {
      const r = await ingestCdrNowWithAudit(ctx, me);
      return { status: 200, body: { ok: true, ...r } };
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
      const limited = rejectIfAppRateLimited(
        ctx,
        'cdr-export',
        rateLimitKeyForSessionToken(ctx.sessionToken),
      );
      if (limited) return limited;
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
