import {
  buildBillingDetailRows,
  sumBillingCosts,
  type CdrListFilter,
} from '@openpbx/core';
import { listBillingRatesForCost, listCdrRecordsFiltered } from '@openpbx/db';
import type Database from 'better-sqlite3';

export function getBillingDetailForUi(db: Database.Database, filter: CdrListFilter = {}) {
  const rows = listCdrRecordsFiltered(db, { ...filter, limit: filter.limit ?? 1000 });
  const rates = listBillingRatesForCost(db).map((r) => ({
    prefix: r.prefix,
    perMin: r.perMin,
    setupFee: r.setupFee,
  }));
  const detail = buildBillingDetailRows(
    rows.map((r) => ({
      uniqueid: r.uniqueid,
      src: r.src,
      dst: r.dst,
      startAt: r.startTime,
      billsec: r.billsec,
    })),
    rates,
  );
  return { rows: detail, total: sumBillingCosts(detail) };
}
