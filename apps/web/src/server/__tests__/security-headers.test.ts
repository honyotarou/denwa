import { describe, expect, it } from 'vitest';
import { buildSecurityHeaders } from '../security-headers';

describe('T-SEC-HEADERS-001: security headers single source', () => {
  it('Given production When buildSecurityHeaders Then CSP and XFO', () => {
    const h = buildSecurityHeaders(true);
    expect(h['X-Frame-Options']).toBe('DENY');
    expect(h['Content-Security-Policy']).toContain("script-src 'self'");
    expect(h['Strict-Transport-Security']).toBeTruthy();
  });

  it('Given development When buildSecurityHeaders Then no HSTS', () => {
    const h = buildSecurityHeaders(false);
    expect(h['Strict-Transport-Security']).toBeUndefined();
  });
});
