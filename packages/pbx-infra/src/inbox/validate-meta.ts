import { INBOX_KINDS, INBOX_META_SCHEMA, type InboxMeta } from '@openpbx/core';

const REQUIRED_KEYS = [
  'schema',
  'source',
  'kind',
  'extension',
  'callerId',
  'callerName',
  'uniqueId',
  'recordingFile',
  'receivedAt',
] as const;

/** T-INFRA-014 */
export function validateInboxMeta(value: unknown): value is InboxMeta {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  for (const k of REQUIRED_KEYS) {
    if (!(k in o) || typeof o[k] !== 'string' || o[k] === '') return false;
  }
  if (o.schema !== INBOX_META_SCHEMA) return false;
  if (o.source !== 'asterisk') return false;
  if (!INBOX_KINDS.includes(o.kind as (typeof INBOX_KINDS)[number])) return false;
  const rec = o.recordingFile as string;
  if (rec.includes('/') || rec.includes('\\')) return false;
  return true;
}
