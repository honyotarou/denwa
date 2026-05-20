/** ログイン lockout — 純関数（DB I/O は pbx-db） */

export const LOGIN_LOCKOUT_WINDOW_MINUTES = 15;

export function isLoginLockedOut(failureCount: number, threshold: number): boolean {
  if (threshold <= 0) return false;
  return failureCount >= threshold;
}
