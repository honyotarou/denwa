/** Edge middleware 用: バレル @openpbx/core は node:crypto を含むためサブパスのみ */
import { isIpAllowed } from '@openpbx/core/auth/policy';

/** Edge-safe: optional IP_ALLOW_CIDRS env (comma-separated). Empty = defer to AuthService on server. */
export function resolveMiddlewareIpAllowed(ip: string | undefined): boolean {
  const env = process.env.IP_ALLOW_CIDRS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (env.length === 0) return true;
  return isIpAllowed(ip, env);
}
