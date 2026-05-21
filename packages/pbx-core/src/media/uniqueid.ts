/** 録音ファイル名・Inbox meta から Asterisk uniqueid を抽出（T-MEDIA-001） */

const RECORDING_PREFIX_RE = /^(\d+\.\d+)-/;

export function parseUniqueidFromRecordingFilename(filename: string): string | null {
  const base = filename.trim();
  if (!base.endsWith('.wav')) return null;
  const m = RECORDING_PREFIX_RE.exec(base);
  return m?.[1] ?? null;
}

export function parseUniqueidFromInboxMeta(meta: unknown): string | null {
  if (!meta || typeof meta !== 'object') return null;
  const uid = (meta as { uniqueId?: unknown }).uniqueId;
  return typeof uid === 'string' && uid.trim() ? uid.trim() : null;
}
