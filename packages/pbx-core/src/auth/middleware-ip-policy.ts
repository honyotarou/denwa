import { isIpAllowed } from './policy.js';

export type MiddlewareIpPolicyInput = Readonly<{
  ip: string | undefined;
  envCidrs: readonly string[];
  nodeEnv: string | undefined;
}>;

/**
 * Edge middleware: 本番で IP_ALLOW_CIDRS 未設定なら deny（F-008 / T-SEC-IP-001）。
 * 開発 compose は true（サーバー側 DB allowlist に委譲）。
 */
export function resolveMiddlewareIpAllowed(input: MiddlewareIpPolicyInput): boolean {
  const cidrs = input.envCidrs.filter(Boolean);
  if (cidrs.length > 0) return isIpAllowed(input.ip, cidrs);
  if (input.nodeEnv === 'production') return false;
  return true;
}
