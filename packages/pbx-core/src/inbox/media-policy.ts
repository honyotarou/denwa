export { INBOX_READ_MIN_ROLE } from '../auth/pbx-api-policy.js';

const SAFE_INBOX_WAV = /^[A-Za-z0-9._-]+\.wav$/;

export function isSafeInboxWavName(filename: string): boolean {
  return SAFE_INBOX_WAV.test(filename);
}
