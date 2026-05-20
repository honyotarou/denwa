import { describe, expect, it } from 'vitest';
import { isLoginLockedOut, LOGIN_LOCKOUT_WINDOW_MINUTES } from '../auth/lockout.js';

describe('T-SEC-LOCKOUT-001: lockout policy', () => {
  it('Given failures below threshold When isLoginLockedOut Then false', () => {
    expect(isLoginLockedOut(4, 5)).toBe(false);
  });

  it('Given failures at threshold When isLoginLockedOut Then true', () => {
    expect(isLoginLockedOut(5, 5)).toBe(true);
  });

  it('Given window constant When read Then 15 minutes', () => {
    expect(LOGIN_LOCKOUT_WINDOW_MINUTES).toBe(15);
  });
});
