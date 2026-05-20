/** notify-event.sh と同型の inbox meta.json（§9.3） */

export const INBOX_META_SCHEMA = 'command-room-pbx/v1' as const;
export const INBOX_KINDS = ['same_day_reservation', 'callback_request'] as const;
export type InboxKind = (typeof INBOX_KINDS)[number];

export type BuildInboxMetaInput = Readonly<{
  kind: InboxKind;
  extension: string;
  callerId: string;
  callerName: string;
  uniqueId: string;
  /** basename のみ（パス禁止） */
  recordingFile: string;
  receivedAt: string;
}>;

export type InboxMeta = Readonly<{
  schema: typeof INBOX_META_SCHEMA;
  source: 'asterisk';
  kind: InboxKind;
  extension: string;
  callerId: string;
  callerName: string;
  uniqueId: string;
  recordingFile: string;
  receivedAt: string;
}>;

export function buildInboxMeta(input: BuildInboxMetaInput): InboxMeta {
  if (!INBOX_KINDS.includes(input.kind)) {
    throw new Error(`invalid kind: ${input.kind}`);
  }
  if (input.recordingFile.includes('/') || input.recordingFile.includes('\\')) {
    throw new Error('recordingFile must be basename only');
  }
  return {
    schema: INBOX_META_SCHEMA,
    source: 'asterisk',
    kind: input.kind,
    extension: input.extension,
    callerId: input.callerId,
    callerName: input.callerName,
    uniqueId: input.uniqueId,
    recordingFile: input.recordingFile,
    receivedAt: input.receivedAt,
  };
}
