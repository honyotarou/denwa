import type Database from 'better-sqlite3';
import { parseUniqueidFromRecordingFilename } from '@openpbx/core';
import { upsertRecordingFile } from '@openpbx/db';
import { listRecordingFiles } from '../fs/inbox-list.js';

/** 録音ディレクトリを走査し recording_files に同期（T-MEDIA-SYNC-001） */
export async function syncRecordingFilesIndex(
  db: Database.Database,
  recordingsDir: string,
): Promise<number> {
  const files = await listRecordingFiles(recordingsDir);
  for (const f of files) {
    upsertRecordingFile(db, {
      name: f.name,
      uniqueid: parseUniqueidFromRecordingFilename(f.name),
      sizeBytes: f.size,
    });
  }
  return files.length;
}
