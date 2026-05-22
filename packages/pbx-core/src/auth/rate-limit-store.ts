/** レートリミット永続化 adapter（T-SEC-RATE-003）— 実装は web、契約は core */

import type { RateLimitState } from './rate-limit.js';

export type RateLimitStore = Readonly<{
  get(key: string): RateLimitState | undefined;
  set(key: string, state: RateLimitState, nowMs: number): void;
  clear(): void;
}>;

type StoreEntry = Readonly<{ state: RateLimitState; lastAccessMs: number }>;

export type BoundedRateLimitStoreOptions = Readonly<{
  maxKeys?: number;
  idleTtlMs?: number;
}>;

const DEFAULT_MAX_KEYS = 10_000;
const DEFAULT_IDLE_TTL_MS = 3_600_000;

function evictStaleAndOverflow(
  map: Map<string, StoreEntry>,
  nowMs: number,
  maxKeys: number,
  idleTtlMs: number,
): void {
  for (const [key, entry] of map) {
    if (nowMs - entry.lastAccessMs > idleTtlMs) map.delete(key);
  }
  while (map.size > maxKeys) {
    let oldestKey: string | null = null;
    let oldestMs = Number.POSITIVE_INFINITY;
    for (const [key, entry] of map) {
      if (entry.lastAccessMs < oldestMs) {
        oldestMs = entry.lastAccessMs;
        oldestKey = key;
      }
    }
    if (!oldestKey) break;
    map.delete(oldestKey);
  }
}

export function createBoundedRateLimitStore(
  options: BoundedRateLimitStoreOptions = {},
): RateLimitStore {
  const maxKeys = options.maxKeys ?? DEFAULT_MAX_KEYS;
  const idleTtlMs = options.idleTtlMs ?? DEFAULT_IDLE_TTL_MS;
  const map = new Map<string, StoreEntry>();

  return {
    get(key: string) {
      return map.get(key)?.state;
    },
    set(key: string, state: RateLimitState, nowMs: number) {
      map.set(key, { state, lastAccessMs: nowMs });
      evictStaleAndOverflow(map, nowMs, maxKeys, idleTtlMs);
    },
    clear() {
      map.clear();
    },
  };
}
