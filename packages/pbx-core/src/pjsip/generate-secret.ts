import { randomBytes } from 'node:crypto';
import { isForbiddenExtensionSecret } from './tracked-secrets.js';

/** bootstrap / ローテーション用（禁止リストと衝突しないまで再試行） */
export function generateExtensionSecret(): string {
  for (let i = 0; i < 8; i++) {
    const s = randomBytes(18).toString('base64url');
    if (!isForbiddenExtensionSecret(s) && s.length >= 12) return s;
  }
  return randomBytes(24).toString('base64url');
}
