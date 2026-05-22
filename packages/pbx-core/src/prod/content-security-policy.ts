/** CSP 組み立て（T-SEC-HEADERS-001 / T-SEC-CSP-001） */

export type ContentSecurityPolicyOptions = Readonly<{
  /** middleware が生成する nonce — 未指定時は script-src self のみ */
  scriptNonce?: string;
  /** softphone WSS — 例: wss://localhost:8089 */
  wssConnectHosts?: readonly string[];
}>;

export function buildContentSecurityPolicy(options: ContentSecurityPolicyOptions = {}): string {
  const nonce = options.scriptNonce?.trim();
  const scriptSrc = nonce
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
    : "script-src 'self'";

  const wssHosts = (options.wssConnectHosts ?? [])
    .map((h) => h.trim())
    .filter(Boolean);
  const connectSrc =
    wssHosts.length > 0 ? `connect-src 'self' ${wssHosts.join(' ')}` : "connect-src 'self'";

  return [
    "default-src 'self'",
    scriptSrc,
    "object-src 'none'",
    connectSrc,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

/** Request Host から softphone WSS allowlist を組み立て */
export function wssConnectHostsForRequestHost(
  host: string | undefined,
  port = 8089,
): readonly string[] {
  const h = host?.split(':')[0]?.trim();
  if (!h) return [];
  return [`wss://${h}:${port}`];
}
