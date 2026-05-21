import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit';
import { syncCdrFromMasterCsv } from './cdr-sync';
import { syncMediaIndexesFromContext } from './media-sync';

/** supervisor+: Master.csv 取り込み + メディア索引（T-CDR-ACT-001） */
export async function ingestCdrNowWithAudit(
  ctx: AppContext,
  me: SessionAccount,
): Promise<{ ingested: number }> {
  const r = await syncCdrFromMasterCsv(ctx.db);
  await syncMediaIndexesFromContext(ctx);
  audit(ctx, me, 'cdr.ingest', String(r.ingested));
  return { ingested: r.ingested };
}
