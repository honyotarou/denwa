import { describe, expect, it } from 'vitest';
import {
  clientIpForMiddleware,
  clientIpFromHeaders,
  clientIpOptional,
  resolveClientIp,
} from '../request-ip';

describe('T-API-IP-002: request-ip with trusted proxy', () => {
  it('Given TRUSTED_PROXY_COUNT=1 When XFF chain Then rightmost trusted hop', () => {
    const h = new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' });
    expect(clientIpFromHeaders(h, 1)).toBe('10.0.0.1');
  });

  it('Given trusted=0 When XFF present Then ignore (default loopback)', () => {
    const h = new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' });
    expect(clientIpFromHeaders(h, 0)).toBe('127.0.0.1');
    expect(resolveClientIp(h, 0)).toBeUndefined();
  });

  it('Given no proxy headers When clientIpFromHeaders Then loopback default', () => {
    expect(clientIpFromHeaders(new Headers(), 0)).toBe('127.0.0.1');
  });

  it('Given no proxy headers When clientIpOptional Then undefined', () => {
    expect(clientIpOptional(new Headers(), 0)).toBeUndefined();
  });

  it('Given no proxy headers When clientIpForMiddleware Then same as fromHeaders (T-MW-007)', () => {
    const h = new Headers();
    expect(clientIpForMiddleware(h, 0)).toBe(clientIpFromHeaders(h, 0));
  });
});
