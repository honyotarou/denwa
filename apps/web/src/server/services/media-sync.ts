import type Database from 'better-sqlite3';
import { syncInboxEventsIndex, syncRecordingFilesIndex } from '@openpbx/infra';
import type { AppContext } from '../context';
import { inboxDirectory, recordingsDirectory } from '../paths';

/** 録音・Inbox を SQLite 索引に同期（CDR 横断リンク用） */
export async function syncMediaIndexes(db: Database.Database): Promise<void> {
  await syncRecordingFilesIndex(db, recordingsDirectory());
  await syncInboxEventsIndex(db, inboxDirectory());
}

export async function syncMediaIndexesFromContext(ctx: AppContext): Promise<void> {
  await syncMediaIndexes(ctx.db);
}
