'use server';

import { getRequestContext } from '@/lib/auth';
import { ingestCdrNowWithAudit } from '@/server/services/cdr-ingest';
import { flash } from './_flash';

/** P0: POST で CDR + メディア索引を取り込む（GET リンク不可） */
export async function ingestCdrNowAction(): Promise<void> {
  await flash('/cdr', 'CDR を取り込みました', async () => {
    const ctx = await getRequestContext();
    const me = ctx.auth.requireRole(ctx.sessionToken, ctx.meta, 'supervisor');
    await ingestCdrNowWithAudit(ctx, me);
  });
}
