import { describe, expect, it, beforeEach } from 'vitest';
import { checkRateLimit, EMPTY_RATE_LIMIT_STATE, RATE_LIMIT_POLICIES } from '@openpbx/core/auth/rate-limit';
import { rejectIfAppRateLimited, resetAppRateLimitStoreForTests } from '../services/app-rate-limit';
import { createTestContext, loginAsAdmin } from '../context';

describe('T-SEC-RATE-001: app rate limit', () => {
  beforeEach(() => resetAppRateLimitStoreForTests());

  it('Given burst login When over policy Then 429', () => {
    const ctx = createTestContext();
    const max = RATE_LIMIT_POLICIES.login.maxHits;
    for (let i = 0; i < max; i++) {
      expect(rejectIfAppRateLimited(ctx, 'login', '127.0.0.1')).toBeNull();
    }
    const denied = rejectIfAppRateLimited(ctx, 'login', '127.0.0.1');
    expect(denied?.status).toBe(429);
  });

  it('core window expires', () => {
    let s = EMPTY_RATE_LIMIT_STATE;
    s = checkRateLimit(s, 0, 1000, 1).state;
    expect(checkRateLimit(s, 2000, 1000, 1).allowed).toBe(true);
  });
});

describe('T-SEC-RATE-002: PII export rate limits', () => {
  beforeEach(() => resetAppRateLimitStoreForTests());

  it('Given burst phonebook-lookup When over policy Then 429', async () => {
    const ctx = createTestContext();
    ctx.sessionToken = await loginAsAdmin(ctx);
    const max = RATE_LIMIT_POLICIES['phonebook-lookup'].maxHits;
    const key = ctx.sessionToken!.slice(0, 32);
    for (let i = 0; i < max; i++) {
      expect(rejectIfAppRateLimited(ctx, 'phonebook-lookup', key)).toBeNull();
    }
    expect(rejectIfAppRateLimited(ctx, 'phonebook-lookup', key)?.status).toBe(429);
  });

  it('Given burst cdr-export When over policy Then 429', async () => {
    const ctx = createTestContext();
    ctx.sessionToken = await loginAsAdmin(ctx);
    const max = RATE_LIMIT_POLICIES['cdr-export'].maxHits;
    const key = ctx.sessionToken!.slice(0, 32);
    for (let i = 0; i < max; i++) {
      expect(rejectIfAppRateLimited(ctx, 'cdr-export', key)).toBeNull();
    }
    expect(rejectIfAppRateLimited(ctx, 'cdr-export', key)?.status).toBe(429);
  });
});
