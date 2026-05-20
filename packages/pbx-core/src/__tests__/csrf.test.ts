import { describe, expect, it } from 'vitest';
import { isAllowedPostOrigin } from '../http/csrf.js';

describe('T-SEC-CSRF-001: POST Origin guard', () => {
  it('Given matching origin When check Then allowed', () => {
    expect(isAllowedPostOrigin('http://localhost:3000', 'localhost:3000')).toBe(true);
  });

  it('Given evil origin When check Then denied', () => {
    expect(isAllowedPostOrigin('https://evil.com', 'localhost:3000')).toBe(false);
  });

  it('Given null origin and same-origin fetch When check Then allowed', () => {
    expect(isAllowedPostOrigin(null, 'localhost:3000', 'same-origin')).toBe(true);
  });

  it('T-SEC-CSRF-002: Given null origin without fetch hint When check Then denied', () => {
    expect(isAllowedPostOrigin(null, 'localhost:3000')).toBe(false);
  });
});
