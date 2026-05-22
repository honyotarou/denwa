import {
  checkRateLimit,
  createBoundedRateLimitStore,
  EMPTY_RATE_LIMIT_STATE,
  RATE_LIMIT_POLICIES,
  type RateLimitScope,
} from '@openpbx/core';
import type { AppContext } from '../context';
import type { JsonHandlerResult } from '../api/types';

const store = createBoundedRateLimitStore();

export function rejectIfAppRateLimited(
  ctx: Pick<AppContext, 'auth' | 'meta'>,
  scope: RateLimitScope,
  keySuffix: string | undefined,
  nowMs = Date.now(),
): JsonHandlerResult | null {
  const key = `${scope}:${keySuffix ?? 'unknown'}`;
  const policy = RATE_LIMIT_POLICIES[scope];
  const prev = store.get(key) ?? EMPTY_RATE_LIMIT_STATE;
  const result = checkRateLimit(prev, nowMs, policy.windowMs, policy.maxHits);
  store.set(key, result.state, nowMs);
  if (result.allowed) return null;
  ctx.auth.recordAudit({
    actor: 'system',
    action: 'rate_limit.exceeded',
    target: `${scope}:${keySuffix}`,
    ip: ctx.meta.ip,
    userAgent: ctx.meta.userAgent,
  });
  return {
    status: 429,
    body: { error: `rate limit exceeded; retry after ${result.retryAfterSec ?? 60}s` },
  };
}

/** Vitest: reset in-memory window between tests */
export function resetAppRateLimitStoreForTests(): void {
  store.clear();
}
