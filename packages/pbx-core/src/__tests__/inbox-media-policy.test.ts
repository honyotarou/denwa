import { describe, expect, it } from 'vitest';
import { INBOX_READ_MIN_ROLE, isSafeInboxWavName } from '../inbox/media-policy.js';

describe('T-INBOX-READ-001: inbox media policy', () => {
  it('Given traversal name When isSafeInboxWavName Then false', () => {
    expect(isSafeInboxWavName('../x.wav')).toBe(false);
    expect(isSafeInboxWavName('ok.wav')).toBe(true);
  });

  it('Given policy When role Then user+', () => {
    expect(INBOX_READ_MIN_ROLE).toBe('user');
  });
});
