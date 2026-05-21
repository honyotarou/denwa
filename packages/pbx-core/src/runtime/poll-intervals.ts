/** バックグラウンドポーリング間隔（ms）— env で上書き可 */

const DEFAULT_CDR_POLL_MS = 10_000;
const DEFAULT_CONCURRENCY_POLL_MS = 30_000;

export function resolveCdrPollIntervalMs(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.CDR_POLL_INTERVAL_MS);
  return Number.isFinite(n) && n >= 1000 ? n : DEFAULT_CDR_POLL_MS;
}

export function resolveConcurrencyPollIntervalMs(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.CONCURRENCY_POLL_INTERVAL_MS);
  return Number.isFinite(n) && n >= 5000 ? n : DEFAULT_CONCURRENCY_POLL_MS;
}
