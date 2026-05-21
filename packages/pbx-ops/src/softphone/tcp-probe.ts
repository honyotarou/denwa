import net from 'node:net';

/** G4b: WSS ポート（TLS 前段）到達性 — I/O は ops のみ */
export function probeTcpPort(
  host: string,
  port: number,
  timeoutMs = 2000,
): Promise<Readonly<{ ok: boolean; error?: string }>> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: timeoutMs });
    socket.once('connect', () => {
      socket.end();
      resolve({ ok: true });
    });
    socket.once('error', (e) => {
      socket.destroy();
      resolve({ ok: false, error: e instanceof Error ? e.message : String(e) });
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve({ ok: false, error: 'timeout' });
    });
  });
}
