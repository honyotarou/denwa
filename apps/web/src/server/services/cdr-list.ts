import type { CdrListFilter } from '@openpbx/core';
import {
  attachCdrMediaLinks,
  enrichCdrRowsForUi,
  mediaLinkMapsFromRows,
  normalizeCdrListFilter,
} from '@openpbx/core';
import {
  listBillingRatesForCost,
  listCdrRecordsFiltered,
  listInboxLinksByUniqueid,
  listRecordingLinksByUniqueid,
} from '@openpbx/db';
import type Database from 'better-sqlite3';
import { syncCdrFromMasterCsv } from './cdr-sync';
import { syncMediaIndexes } from './media-sync';

export type CdrSearchParams = Readonly<{
  from?: string;
  to?: string;
  src?: string;
  dst?: string;
  disposition?: string;
}>;

export function cdrFilterFromSearchParams(sp: CdrSearchParams): CdrListFilter {
  return normalizeCdrListFilter({
    from: sp.from,
    to: sp.to,
    src: sp.src,
    dst: sp.dst,
    disposition: sp.disposition,
    limit: 300,
  });
}

export async function listCdrForUiFiltered(db: Database.Database, filter: CdrListFilter) {
  await syncCdrFromMasterCsv(db);
  await syncMediaIndexes(db);
  const rows = listCdrRecordsFiltered(db, filter);
  const rates = listBillingRatesForCost(db).map((r) => ({
    prefix: r.prefix,
    perMin: r.perMin,
    setupFee: r.setupFee,
  }));
  const enriched = enrichCdrRowsForUi(
    rows.map((r) => ({
      uniqueid: r.uniqueid,
      startTime: r.startTime,
      src: r.src,
      dst: r.dst,
      billsec: r.billsec,
      disposition: r.disposition,
    })),
    rates,
  );
  const { recordingByUniqueid, inboxMetaByUniqueid } = mediaLinkMapsFromRows(
    listRecordingLinksByUniqueid(db),
    listInboxLinksByUniqueid(db),
  );
  return { rows: attachCdrMediaLinks(enriched, recordingByUniqueid, inboxMetaByUniqueid), raw: rows };
}
