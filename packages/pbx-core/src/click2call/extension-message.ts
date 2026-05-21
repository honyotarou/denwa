/** content.js → background.js メッセージ契約（T-CHX-G5 / G5b） */

export const CLICK2CALL_MSG_ORIGINATE = 'originate' as const;

export type OriginateContentMessage = Readonly<{
  type: typeof CLICK2CALL_MSG_ORIGINATE;
  to: string;
}>;

export function parseOriginateContentMessage(msg: unknown): OriginateContentMessage | null {
  if (!msg || typeof msg !== 'object') return null;
  const m = msg as Record<string, unknown>;
  if (m.type !== CLICK2CALL_MSG_ORIGINATE) return null;
  const to = String(m.to ?? '').trim();
  if (!to) return null;
  return { type: CLICK2CALL_MSG_ORIGINATE, to };
}
