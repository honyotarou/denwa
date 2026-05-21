/** WSS エンドポイント（T-SOFT / sip.js 正本） */

export type SipJsTransportOptions = Readonly<{
  server: string;
  connectionTimeout: number;
}>;

export function buildWssTransportUrl(host: string, port = 8089): string {
  const h = (host ?? '').trim() || 'localhost';
  return `wss://${h}:${port}/ws`;
}

/** sip.js UserAgent transportOptions（connectionTimeout 秒） */
export function buildSipJsTransportOptions(
  host: string,
  opts?: { port?: number; connectionTimeoutSec?: number },
): SipJsTransportOptions {
  return {
    server: buildWssTransportUrl(host, opts?.port ?? 8089),
    connectionTimeout: opts?.connectionTimeoutSec ?? 5,
  };
}
