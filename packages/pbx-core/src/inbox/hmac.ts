import { createHmac, timingSafeEqual } from 'node:crypto';
import type { InboxMeta } from './meta.js';

export const INBOX_INTEGRITY_ALG = 'hmac-sha256' as const;

export type InboxMetaIntegrity = Readonly<{
  alg: typeof INBOX_INTEGRITY_ALG;
  value: string;
}>;

export type InboxMetaSigned = InboxMeta &
  Readonly<{
    integrity?: InboxMetaIntegrity;
  }>;

/** notify-event.sh / 検証側で同一の canonical JSON（キー順固定） */
export function inboxMetaCanonicalJson(meta: InboxMeta): string {
  return JSON.stringify({
    schema: meta.schema,
    source: meta.source,
    kind: meta.kind,
    extension: meta.extension,
    callerId: meta.callerId,
    callerName: meta.callerName,
    uniqueId: meta.uniqueId,
    recordingFile: meta.recordingFile,
    receivedAt: meta.receivedAt,
  });
}

export function computeInboxMetaHmac(meta: InboxMeta, secret: string): string {
  const key = (secret ?? '').trim();
  if (!key) return '';
  return createHmac('sha256', key).update(inboxMetaCanonicalJson(meta)).digest('hex');
}

export function buildInboxMetaIntegrity(meta: InboxMeta, secret: string): InboxMetaIntegrity {
  const value = computeInboxMetaHmac(meta, secret);
  if (!value) throw new Error('INBOX_HMAC_SECRET required for integrity');
  return { alg: INBOX_INTEGRITY_ALG, value };
}

export function verifyInboxMetaIntegrity(
  signed: InboxMetaSigned,
  secret: string,
): boolean {
  const key = (secret ?? '').trim();
  if (!key) return true;
  const integrity = signed.integrity;
  if (!integrity || integrity.alg !== INBOX_INTEGRITY_ALG) return false;
  if (!/^[a-f0-9]{64}$/i.test(integrity.value)) return false;
  const expected = computeInboxMetaHmac(signed, key);
  try {
    return timingSafeEqual(Buffer.from(integrity.value, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}
