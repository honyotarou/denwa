import { INBOX_KINDS, INBOX_META_SCHEMA, type InboxMeta } from './meta.js';
import { INBOX_INTEGRITY_ALG, verifyInboxMetaIntegrity, type InboxMetaSigned } from './hmac.js';

const INBOX_FIELD_SAFE_RE = /^[a-zA-Z0-9._\- @]{0,80}$/;
const INBOX_ISO_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

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

function fieldOk(key: (typeof REQUIRED_KEYS)[number], value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (key === 'recordingFile' && value === '') return true;
  if (value === '') return false;
  if (key === 'receivedAt') return INBOX_ISO_TIME_RE.test(value);
  if (key === 'schema') return value === INBOX_META_SCHEMA;
  if (key === 'source') return value === 'asterisk';
  if (key === 'kind') return INBOX_KINDS.includes(value as (typeof INBOX_KINDS)[number]);
  if (key === 'recordingFile') {
    return !value.includes('/') && !value.includes('\\') && INBOX_FIELD_SAFE_RE.test(value);
  }
  return INBOX_FIELD_SAFE_RE.test(value);
}

function integrityOk(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object') return false;
  const i = value as Record<string, unknown>;
  if (i.alg !== INBOX_INTEGRITY_ALG) return false;
  return typeof i.value === 'string' && /^[a-f0-9]{64}$/i.test(i.value);
}

/** T-INFRA-014 / F-009: inbox meta.json の構造 + フィールド安全化 */
export function validateInboxMetaShape(value: unknown): value is InboxMeta {
  if (!validateInboxMetaShapeLoose(value)) return false;
  return true;
}

export function validateInboxMetaShapeLoose(value: unknown): value is InboxMetaSigned {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  for (const k of REQUIRED_KEYS) {
    if (!fieldOk(k, o[k])) return false;
  }
  if (o.schema !== INBOX_META_SCHEMA) return false;
  if (o.source !== 'asterisk') return false;
  if (!INBOX_KINDS.includes(o.kind as (typeof INBOX_KINDS)[number])) return false;
  const rec = o.recordingFile as string;
  if (rec.includes('/') || rec.includes('\\')) return false;
  if (!integrityOk(o.integrity)) return false;
  return true;
}

/** 本番: INBOX_HMAC_SECRET 設定時は integrity 必須 + 検証 */
export function validateInboxMetaForIngest(
  value: unknown,
  hmacSecret: string,
): value is InboxMetaSigned {
  if (!validateInboxMetaShapeLoose(value)) return false;
  const secret = (hmacSecret ?? '').trim();
  if (!secret) return true;
  const signed = value as InboxMetaSigned;
  if (!signed.integrity) return false;
  return verifyInboxMetaIntegrity(signed, secret);
}
