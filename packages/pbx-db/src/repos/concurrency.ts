import type Database from 'better-sqlite3';

export function upsertConcurrencySnapshot(db: Database.Database, minuteAt: string, channels: number): void {
  db.prepare(
    `INSERT INTO concurrency_snapshots (minute_at, channels, recorded_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(minute_at) DO UPDATE SET
       channels = MAX(channels, excluded.channels),
       recorded_at = datetime('now')`,
  ).run(minuteAt, channels);
}

export function getConcurrencySnapshot(db: Database.Database, minuteAt: string): number | null {
  const row = db.prepare('SELECT channels FROM concurrency_snapshots WHERE minute_at = ?').get(minuteAt) as
    | { channels: number }
    | undefined;
  return row?.channels ?? null;
}
