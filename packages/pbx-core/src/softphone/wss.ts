/** WSS エンドポイント（T-SOFT / sip.js 正本） */

export function buildWssTransportUrl(host: string, port = 8089): string {
  const h = (host ?? '').trim() || 'localhost';
  return `wss://${h}:${port}/ws`;
}
