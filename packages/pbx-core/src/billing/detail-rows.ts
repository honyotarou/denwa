import { billingRowCost, type BillingRate } from './cost.js';

export type BillingDetailRow = Readonly<{
  uniqueid: string;
  src: string | null;
  dst: string | null;
  startAt: string | null;
  billsec: number;
  ratePrefix: string | null;
  cost: number;
}>;

export function buildBillingDetailRows(
  cdrRows: ReadonlyArray<{
    uniqueid: string;
    src: string | null;
    dst: string | null;
    startAt: string | null;
    billsec: number;
  }>,
  rates: readonly BillingRate[],
): readonly BillingDetailRow[] {
  return cdrRows.map((c) => {
    const { rate, cost } = billingRowCost(c.dst, c.billsec, rates);
    return {
      uniqueid: c.uniqueid,
      src: c.src,
      dst: c.dst,
      startAt: c.startAt,
      billsec: c.billsec,
      ratePrefix: rate?.prefix ?? null,
      cost,
    };
  });
}

export function sumBillingCosts(rows: readonly BillingDetailRow[]): number {
  const total = rows.reduce((a, r) => a + r.cost, 0);
  return Math.round(total * 100) / 100;
}
