import { describe, expect, it } from 'vitest';
import { clientIpFromHeaders, clientIpOptional } from '../request-ip';

describe('T-API-IP-002: request-meta propagates proxy IP', () => {
  it('Given X-Forwarded-For When clientIpFromHeaders Then first hop', () => {
    const h = new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' });
    expect(clientIpFromHeaders(h)).toBe('203.0.113.5');
  });

  it('Given no proxy headers When clientIpFromHeaders Then loopback default', () => {
    expect(clientIpFromHeaders(new Headers())).toBe('127.0.0.1');
  });

  it('Given no proxy headers When clientIpOptional Then undefined', () => {
    expect(clientIpOptional(new Headers())).toBeUndefined();
  });
});
