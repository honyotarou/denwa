/** NAT / Tailscale 用 network_settings 検証（T-NET-*）— 単一正本 */

export type NetworkSettingsInput = Readonly<{
  externalIp?: string;
  externalSignalingIp?: string;
  localNet?: string;
}>;

export type NetworkSettingsDraft = Readonly<{
  externalIp: string | null;
  externalSignalingIp: string | null;
  localNet: string | null;
}>;

function parseIpv4Octets(ip: string): number[] | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;
  const octets: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n < 0 || n > 255) return null;
    octets.push(n);
  }
  return octets;
}

export function validateIpv4(ip: string): string | null {
  const t = ip.trim();
  if (!t) return 'IPv4 が空です';
  return parseIpv4Octets(t) ? null : 'IPv4 形式が不正です';
}

export function validateCidr(cidr: string): string | null {
  const t = cidr.trim();
  const m = t.match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
  if (!m) return 'CIDR 形式が不正です';
  if (!parseIpv4Octets(m[1]!)) return 'CIDR の IP 部分が不正です';
  const prefix = Number(m[2]);
  if (prefix < 0 || prefix > 32) return 'CIDR プレフィックスが不正です';
  return null;
}

/** カンマ区切り CIDR を正規化（trim・空除去・重複除去・安定ソート） */
export function normalizeLocalNetCsv(csv: string | null | undefined): string | null {
  if (csv == null || !String(csv).trim()) return null;
  const parts = String(csv)
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const uniq = [...new Set(parts)].sort();
  return uniq.join(',');
}

export function validateLocalNetCsv(csv: string | null | undefined): readonly string[] {
  const normalized = normalizeLocalNetCsv(csv);
  if (!normalized) return [];
  const errs: string[] = [];
  for (const cidr of normalized.split(',')) {
    const e = validateCidr(cidr);
    if (e) errs.push(`${cidr}: ${e}`);
  }
  return errs;
}

export function validateNetworkSettingsInput(input: NetworkSettingsInput): readonly string[] {
  const errs: string[] = [];
  if (input.externalIp?.trim()) {
    const e = validateIpv4(input.externalIp);
    if (e) errs.push(`externalIp: ${e}`);
  }
  if (input.externalSignalingIp?.trim()) {
    const e = validateIpv4(input.externalSignalingIp);
    if (e) errs.push(`externalSignalingIp: ${e}`);
  }
  errs.push(...validateLocalNetCsv(input.localNet));
  return errs;
}

export function normalizeNetworkSettingsDraft(input: NetworkSettingsInput): NetworkSettingsDraft {
  const ext = input.externalIp?.trim() || null;
  const sigRaw = input.externalSignalingIp?.trim() || null;
  return {
    externalIp: ext,
    externalSignalingIp: sigRaw ?? ext,
    localNet: normalizeLocalNetCsv(input.localNet),
  };
}

/** PJSIP ini 値として安全か（改行・制御文字禁止） */
export function isSafePjsipIniValue(value: string): boolean {
  return /^[\d.a-zA-Z/:_-]+$/.test(value);
}
