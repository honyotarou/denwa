import { describe, expect, it } from 'vitest';
import { buildSecurityHeaders } from '../security-headers';

describe('T-SEC-HEADERS-001 / T-SEC-CSP-001: security headers', () => {
  it('Given production + nonce When buildSecurityHeaders Then strict CSP', () => {
    const h = buildSecurityHeaders(true, {
      scriptNonce: 'test-nonce',
      wssConnectHosts: ['wss://localhost:8089'],
    });
    expect(h['X-Frame-Options']).toBe('DENY');
    expect(h['Content-Security-Policy']).toContain("'nonce-test-nonce'");
    expect(h['Content-Security-Policy']).not.toContain('unsafe-inline');
    expect(h['Content-Security-Policy']).toContain('wss://localhost:8089');
    expect(h['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(h['Strict-Transport-Security']).toBeTruthy();
  });

  it('Given development When buildSecurityHeaders Then no HSTS', () => {
    const h = buildSecurityHeaders(false, { scriptNonce: 'dev-nonce' });
    expect(h['Strict-Transport-Security']).toBeUndefined();
  });
});
