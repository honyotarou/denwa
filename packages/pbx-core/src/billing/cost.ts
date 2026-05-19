/** レート表と CDR 秒数から課金額を算出（DB 非依存） */

export type BillingRate = Readonly<{
  prefix: string;
  perMin: number;
  setupFee: number;
}>;

export function pickRateForDst(
  dst: string | null,
  rates: readonly BillingRate[],
): BillingRate | null {
  if (!dst) return null;
  const sorted = [...rates].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const r of sorted) {
    if (dst.startsWith(r.prefix)) return r;
  }
  return null;
}

export function computeCallCost(billsec: number, rate: BillingRate | null): number {
  if (!rate || billsec <= 0) return 0;
  const raw = rate.setupFee + (billsec / 60) * rate.perMin;
  return Math.round(raw * 100) / 100;
}

export function billingRowCost(
  dst: string | null,
  billsec: number,
  rates: readonly BillingRate[],
): { rate: BillingRate | null; cost: number } {
  const rate = pickRateForDst(dst, rates);
  return { rate, cost: computeCallCost(billsec, rate) };
}
