import type Database from 'better-sqlite3';

export type RecordingFileRow = Readonly<{
  name: string;
  uniqueid: string | null;
  size: number;
}>;

export function upsertRecordingFile(
  db: Database.Database,
  input: { name: string; uniqueid: string | null; sizeBytes: number },
): void {
  db.prepare(
    `INSERT INTO recording_files (name, uniqueid, size_bytes, discovered_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(name) DO UPDATE SET
       uniqueid = excluded.uniqueid,
       size_bytes = excluded.size_bytes,
       discovered_at = datetime('now')`,
  ).run(input.name, input.uniqueid, input.sizeBytes);
}

export function listRecordingFilesForUi(db: Database.Database, limit = 500): RecordingFileRow[] {
  return db
    .prepare(
      `SELECT name, uniqueid, size_bytes AS size FROM recording_files ORDER BY name DESC LIMIT ?`,
    )
    .all(limit) as RecordingFileRow[];
}

export function listRecordingLinksByUniqueid(
  db: Database.Database,
): Array<{ uniqueid: string; name: string }> {
  return db
    .prepare(
      `SELECT uniqueid, name FROM recording_files WHERE uniqueid IS NOT NULL`,
    )
    .all() as Array<{ uniqueid: string; name: string }>;
}
