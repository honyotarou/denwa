import type { TrunkDraft } from './types.js';

/** UI / FormData / API から domain へ（OpenPBX upsertTrunk 相当） */

export type TrunkDraftInput = Readonly<{
  name: string;
  host: string;
  port?: number;
  username?: string | null;
  secret?: string | null;
  registration?: boolean;
  fromUser?: string | null;
  fromDomain?: string | null;
  didInbound?: string | null;
  outboundPrefix?: string | null;
  note?: string | null;
}>;

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t === '' ? null : t;
}

/** 検証前の入力正規化（T-TRUNK-001） */
export function normalizeTrunkDraft(input: TrunkDraftInput): TrunkDraft {
  return {
    name: input.name.trim(),
    host: input.host.trim(),
    port: input.port ?? 5060,
    username: emptyToNull(input.username),
    secret: emptyToNull(input.secret),
    registration: input.registration !== false,
    fromUser: emptyToNull(input.fromUser),
    fromDomain: emptyToNull(input.fromDomain),
    didInbound: emptyToNull(input.didInbound),
    outboundPrefix: emptyToNull(input.outboundPrefix),
  };
}
