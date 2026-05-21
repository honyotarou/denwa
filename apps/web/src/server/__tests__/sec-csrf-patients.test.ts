import { describe, expect, it } from 'vitest';
import { rejectDisallowedPostOrigin } from '../api/post-origin';

describe('T-SEC-CSRF-003: patients records POST', () => {
  it('Given foreign Origin When reject Then 403', () => {
    const req = new Request('https://pbx.example.com/api/patients/records', {
      method: 'POST',
      headers: { host: 'pbx.example.com', origin: 'https://evil.example' },
    });
    expect(rejectDisallowedPostOrigin(req)?.status).toBe(403);
  });
});
