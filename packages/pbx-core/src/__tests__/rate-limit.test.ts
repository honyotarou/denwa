import { describe, expect, it } from 'vitest';
import { checkRateLimit, EMPTY_RATE_LIMIT_STATE, RATE_LIMIT_POLICIES } from '../auth/rate-limit.js';

describe('T-SEC-RATE-001: rate limit', () => {
  it('Given under limit When consume Then allowed', () => {
    const r = checkRateLimit(EMPTY_RATE_LIMIT_STATE, 1000, 60_000, 3);
    expect(r.allowed).toBe(true);
    expect(r.state.hits).toHaveLength(1);
  });

  it('Given over limit When consume Then 429 with retry', () => {
    let s = EMPTY_RATE_LIMIT_STATE;
    for (let i = 0; i < 3; i++) {
      s = checkRateLimit(s, 1000 + i, 60_000, 3).state;
    }
    const r = checkRateLimit(s, 2000, 60_000, 3);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterSec).toBeGreaterThan(0);
  });

  it('Given window elapsed When consume Then allowed again', () => {
    let s = checkRateLimit(EMPTY_RATE_LIMIT_STATE, 0, 1000, 1).state;
    const r = checkRateLimit(s, 2000, 1000, 1);
    expect(r.allowed).toBe(true);
  });

  it('policies defined for sensitive scopes', () => {
    expect(RATE_LIMIT_POLICIES.login.maxHits).toBeGreaterThan(0);
    expect(RATE_LIMIT_POLICIES['originate-bearer'].maxHits).toBeGreaterThan(0);
    expect(RATE_LIMIT_POLICIES.recording.maxHits).toBeGreaterThan(0);
  });
});
