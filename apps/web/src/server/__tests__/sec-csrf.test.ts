import { describe, expect, it } from 'vitest';
import { isAllowedPostOrigin } from '@openpbx/core';
import { rejectDisallowedPostOrigin } from '../api/post-origin';

describe('T-SEC-CSRF-001: POST API Origin', () => {
  it('Given matching origin host When isAllowedPostOrigin Then true', () => {
    expect(isAllowedPostOrigin('https://pbx.example.com', 'pbx.example.com')).toBe(true);
  });

  it('Given foreign origin When isAllowedPostOrigin Then false', () => {
    expect(isAllowedPostOrigin('https://evil.example', 'pbx.example.com')).toBe(false);
  });

  it('Given Sec-Fetch-Site same-origin When rejectDisallowedPostOrigin Then allow', () => {
    const req = new Request('https://pbx.example.com/api/extensions', {
      method: 'POST',
      headers: { host: 'pbx.example.com', 'sec-fetch-site': 'same-origin' },
    });
    expect(rejectDisallowedPostOrigin(req)).toBeNull();
  });

  it('T-SEC-CSRF-002: Given no Origin and no fetch hint When reject Then 403', () => {
    const req = new Request('https://pbx.example.com/api/extensions', {
      method: 'POST',
      headers: { host: 'pbx.example.com' },
    });
    expect(rejectDisallowedPostOrigin(req)?.status).toBe(403);
  });

  it('Given mismatched Origin When rejectDisallowedPostOrigin Then 403', () => {
    const req = new Request('https://pbx.example.com/api/extensions', {
      method: 'POST',
      headers: { host: 'pbx.example.com', origin: 'https://evil.example' },
    });
    expect(rejectDisallowedPostOrigin(req)?.status).toBe(403);
  });
});
