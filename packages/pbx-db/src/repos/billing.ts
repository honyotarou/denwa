import type Database from 'better-sqlite3';
import { duplicateError } from '../errors.js';

export function upsertBillingRate(
  db: Database.Database,
  input: { prefix: string; label?: string; perMin: number; setupFee?: number },
): void {
  try {
    db.prepare(
      `INSERT INTO billing_rates (prefix, label, per_min, setup_fee, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(prefix) DO UPDATE SET
         label = excluded.label,
         per_min = excluded.per_min,
         setup_fee = excluded.setup_fee,
         updated_at = datetime('now')`,
    ).run(input.prefix, input.label ?? null, input.perMin, input.setupFee ?? 0);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('UNIQUE')) throw duplicateError(msg);
    throw e;
  }
}

export function listBillingRates(db: Database.Database): Array<{ prefix: string; per_min: number }> {
  return listBillingRatesForUi(db).map((r) => ({ prefix: r.prefix, per_min: r.perMin }));
}

export type BillingRateUiRow = Readonly<{
  prefix: string;
  label: string | null;
  perMin: number;
  setupFee: number;
}>;

export function listBillingRatesForUi(db: Database.Database): BillingRateUiRow[] {
  return db
    .prepare(
      'SELECT prefix, label, per_min AS perMin, setup_fee AS setupFee FROM billing_rates ORDER BY prefix',
    )
    .all() as BillingRateUiRow[];
}

export function listBillingRatesForCost(
  db: Database.Database,
): Array<{ prefix: string; perMin: number; setupFee: number }> {
  return db
    .prepare('SELECT prefix, per_min AS perMin, setup_fee AS setupFee FROM billing_rates ORDER BY prefix')
    .all() as Array<{ prefix: string; perMin: number; setupFee: number }>;
}

export function deleteBillingRate(db: Database.Database, prefix: string): boolean {
  return db.prepare('DELETE FROM billing_rates WHERE prefix = ?').run(prefix).changes > 0;
}
