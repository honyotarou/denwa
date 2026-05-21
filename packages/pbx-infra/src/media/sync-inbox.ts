import fs from 'node:fs/promises';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { parseUniqueidFromInboxMeta } from '@openpbx/core';
import { upsertInboxEvent } from '@openpbx/db';

function parseMetaFields(raw: string): {
  kind: string | null;
  extension: string | null;
  callerId: string | null;
  receivedAt: string | null;
  uniqueid: string | null;
} {
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    return {
      kind: typeof j.kind === 'string' ? j.kind : null,
      extension: typeof j.extension === 'string' ? j.extension : null,
      callerId: typeof j.callerId === 'string' ? j.callerId : null,
      receivedAt: typeof j.receivedAt === 'string' ? j.receivedAt : null,
      uniqueid: parseUniqueidFromInboxMeta(j),
    };
  } catch {
    return { kind: null, extension: null, callerId: null, receivedAt: null, uniqueid: null };
  }
}

/** Inbox ディレクトリを走査し inbox_events に同期（T-MEDIA-SYNC-002） */
export async function syncInboxEventsIndex(db: Database.Database, inboxDir: string): Promise<number> {
  let names: string[];
  try {
    names = await fs.readdir(inboxDir);
  } catch {
    return 0;
  }
  const metas = names.filter((n) => n.endsWith('.meta.json')).sort((a, b) => b.localeCompare(a));
  let count = 0;
  for (const metaName of metas.slice(0, 500)) {
    try {
      const raw = await fs.readFile(path.join(inboxDir, metaName), 'utf8');
      const fields = parseMetaFields(raw);
      const wavName = metaName.endsWith('.meta.json')
        ? `${metaName.slice(0, -'.meta.json'.length)}.wav`
        : null;
      const wavExists = wavName && names.includes(wavName);
      upsertInboxEvent(db, {
        metaName,
        uniqueid: fields.uniqueid,
        kind: fields.kind,
        extension: fields.extension,
        callerId: fields.callerId,
        wavName: wavExists ? wavName : null,
        receivedAt: fields.receivedAt,
      });
      count++;
    } catch {
      /* skip */
    }
  }
  return count;
}
