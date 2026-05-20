import { billingRowCost, type BillingRate } from '../billing/cost.js';

export type CdrUiRow = Readonly<{
  uniqueid: string;
  startTime: string | null;
  src: string | null;
  dst: string | null;
  billsec: number;
  disposition: string | null;
  cost: number;
  ratePrefix: string | null;
}>;

export function enrichCdrRowsForUi(
  rows: ReadonlyArray<{
    uniqueid: string;
    startTime: string | null;
    src: string | null;
    dst: string | null;
    billsec: number;
    disposition: string | null;
  }>,
  rates: readonly BillingRate[],
): readonly CdrUiRow[] {
  return rows.map((r) => {
    const { cost, rate } = billingRowCost(r.dst, r.billsec, rates);
    return {
      ...r,
      cost,
      ratePrefix: rate?.prefix ?? null,
    };
  });
}
