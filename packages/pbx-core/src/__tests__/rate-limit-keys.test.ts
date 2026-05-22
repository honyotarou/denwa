import { describe, expect, it } from 'vitest';
import {
  rateLimitKeyForBearerToken,
  rateLimitKeyForIp,
  rateLimitKeyForSessionToken,
} from '../auth/rate-limit-keys.js';

describe('T-SEC-RATE-003: rate limit keys', () => {
  it('Given bearer token When key Then hash only (IP independent)', () => {
    const hash = (s: string) => `h-${s}`;
    expect(rateLimitKeyForBearerToken('tok', hash)).toBe('h-tok');
    expect(rateLimitKeyForBearerToken('tok', hash)).toBe(rateLimitKeyForBearerToken('tok', hash));
  });

  it('Given session token When key Then stable prefix', () => {
    expect(rateLimitKeyForSessionToken('abcdef1234567890')).toBe('abcdef1234567890');
  });

  it('Given ip When key Then trimmed', () => {
    expect(rateLimitKeyForIp(' 127.0.0.1 ')).toBe('127.0.0.1');
  });
});
