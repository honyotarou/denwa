/** Edge middleware 用: バレル @openpbx/core は node:crypto を含むためサブパスのみ */
import { resolveMiddlewareIpAllowed as resolveFromCore } from '@openpbx/core/auth/middleware-ip-policy';

/** T-SEC-IP-001: 本番は IP_ALLOW_CIDRS 必須。未設定なら middleware で deny。 */
export function resolveMiddlewareIpAllowed(ip: string | undefined): boolean {
  const envCidrs =
    process.env.IP_ALLOW_CIDRS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  return resolveFromCore({
    ip,
    envCidrs,
    nodeEnv: process.env.NODE_ENV,
  });
}
