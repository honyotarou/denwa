import { describe, expect, it } from 'vitest';
import { EMPTY_RATE_LIMIT_STATE } from '../auth/rate-limit.js';
import { createBoundedRateLimitStore } from '../auth/rate-limit-store.js';

describe('T-SEC-RATE-003: bounded rate limit store', () => {
  it('Given idle entry When set with later now Then evicts stale key', () => {
    const store = createBoundedRateLimitStore({ maxKeys: 10, idleTtlMs: 1000 });
    store.set('a', EMPTY_RATE_LIMIT_STATE, 0);
    store.set('b', EMPTY_RATE_LIMIT_STATE, 2000);
    expect(store.get('a')).toBeUndefined();
    expect(store.get('b')).toBeDefined();
  });

  it('Given maxKeys exceeded When set Then evicts LRU', () => {
    const store = createBoundedRateLimitStore({ maxKeys: 2, idleTtlMs: 60_000 });
    store.set('old', EMPTY_RATE_LIMIT_STATE, 0);
    store.set('mid', EMPTY_RATE_LIMIT_STATE, 100);
    store.set('new', EMPTY_RATE_LIMIT_STATE, 200);
    expect(store.get('old')).toBeUndefined();
    expect(store.get('mid')).toBeDefined();
    expect(store.get('new')).toBeDefined();
  });
});
