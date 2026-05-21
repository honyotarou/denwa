/** 固定窓レートリミット（T-SEC-RATE-001）— 永続化は web/infra 側 */

export type RateLimitState = Readonly<{ hits: readonly number[] }>;

export const EMPTY_RATE_LIMIT_STATE: RateLimitState = { hits: [] };

export function checkRateLimit(
  state: RateLimitState,
  nowMs: number,
  windowMs: number,
  maxHits: number,
): Readonly<{ allowed: boolean; state: RateLimitState; retryAfterSec?: number }> {
  const cutoff = nowMs - windowMs;
  const hits = state.hits.filter((t) => t > cutoff);
  if (hits.length >= maxHits) {
    const oldest = hits[0] ?? nowMs;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000));
    return { allowed: false, state: { hits }, retryAfterSec };
  }
  return { allowed: true, state: { hits: [...hits, nowMs] } };
}

export type RateLimitPolicy = Readonly<{ windowMs: number; maxHits: number }>;

export const RATE_LIMIT_POLICIES = {
  login: { windowMs: 60_000, maxHits: 30 },
  'originate-bearer': { windowMs: 60_000, maxHits: 40 },
  recording: { windowMs: 60_000, maxHits: 120 },
} as const satisfies Record<string, RateLimitPolicy>;

export type RateLimitScope = keyof typeof RATE_LIMIT_POLICIES;
