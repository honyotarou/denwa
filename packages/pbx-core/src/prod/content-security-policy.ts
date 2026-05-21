/** CSP 組み立て（T-SEC-HEADERS-001 / softphone WSS） */

/** softphone の wss://<host>:8089 を connect-src で許可 */
export function buildContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "object-src 'none'",
    "connect-src 'self' wss:",
  ].join('; ');
}
