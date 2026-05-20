import { isIpAllowed } from './policy.js';

export type MiddlewareIpPolicyInput = Readonly<{
  ip: string | undefined;
  envCidrs: readonly string[];
  nodeEnv: string | undefined;
}>;

/**
 * Edge middleware: 本番で IP_ALLOW_CIDRS 未設定なら deny（F-008 / T-SEC-IP-001）。
 * Edge は `clientIpFromHeaders` と同型の IP を渡す（TRUSTED_PROXY_COUNT=0 時は 127.0.0.1 既定）。
 */
export function resolveMiddlewareIpAllowed(input: MiddlewareIpPolicyInput): boolean {
  const cidrs = input.envCidrs.filter(Boolean);
  if (cidrs.length > 0) return isIpAllowed(input.ip, cidrs);
  if (input.nodeEnv === 'production') return false;
  return true;
}
