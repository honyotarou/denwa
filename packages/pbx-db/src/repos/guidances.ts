import type Database from 'better-sqlite3';

export type GuidanceRow = Readonly<{
  name: string;
  text: string | null;
  source: string;
  size: number | null;
}>;

export function upsertGuidance(
  db: Database.Database,
  input: { name: string; text?: string; source?: string; size?: number },
): GuidanceRow {
  db.prepare(
    `INSERT INTO guidances (name, text, source, size, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(name) DO UPDATE SET
       text = excluded.text,
       source = excluded.source,
       size = excluded.size,
       updated_at = datetime('now')`,
  ).run(input.name, input.text ?? null, input.source ?? 'upload', input.size ?? null);
  return getGuidance(db, input.name)!;
}

export function getGuidance(db: Database.Database, name: string): GuidanceRow | null {
  const row = db.prepare('SELECT name, text, source, size FROM guidances WHERE name = ?').get(name) as
    | { name: string; text: string | null; source: string; size: number | null }
    | undefined;
  return row ?? null;
}

export function deleteGuidance(db: Database.Database, name: string): boolean {
  return db.prepare('DELETE FROM guidances WHERE name = ?').run(name).changes > 0;
}
