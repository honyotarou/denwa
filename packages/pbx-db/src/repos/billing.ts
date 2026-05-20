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
  return db.prepare('SELECT prefix, per_min FROM billing_rates ORDER BY prefix').all() as Array<{
    prefix: string;
    per_min: number;
  }>;
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
