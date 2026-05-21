import type { CdrUiRow } from '../cdr/ui-row.js';

export type CdrUiRowWithMedia = CdrUiRow &
  Readonly<{
    recordingFile: string | null;
    inboxMetaName: string | null;
  }>;

/** uniqueid → 録音ファイル名 / inbox meta 名（T-MEDIA-002） */
export function attachCdrMediaLinks(
  rows: readonly CdrUiRow[],
  recordingByUniqueid: ReadonlyMap<string, string>,
  inboxMetaByUniqueid: ReadonlyMap<string, string>,
): readonly CdrUiRowWithMedia[] {
  return rows.map((r) => ({
    ...r,
    recordingFile: recordingByUniqueid.get(r.uniqueid) ?? null,
    inboxMetaName: inboxMetaByUniqueid.get(r.uniqueid) ?? null,
  }));
}

export function mediaLinkMapsFromRows(
  recordings: ReadonlyArray<{ uniqueid: string | null; name: string }>,
  inbox: ReadonlyArray<{ uniqueid: string | null; metaName: string }>,
): {
  recordingByUniqueid: Map<string, string>;
  inboxMetaByUniqueid: Map<string, string>;
} {
  const recordingByUniqueid = new Map<string, string>();
  for (const r of recordings) {
    if (r.uniqueid) recordingByUniqueid.set(r.uniqueid, r.name);
  }
  const inboxMetaByUniqueid = new Map<string, string>();
  for (const e of inbox) {
    if (e.uniqueid) inboxMetaByUniqueid.set(e.uniqueid, e.metaName);
  }
  return { recordingByUniqueid, inboxMetaByUniqueid };
}
