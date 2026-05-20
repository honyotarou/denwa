/** T-AMI-003: 指数バックオフ（legacy ami.ts 同等） */
export function amiReconnectDelayMs(retries: number, capMs = 30_000): number {
  return Math.min(capMs, 1000 * 2 ** retries);
}
