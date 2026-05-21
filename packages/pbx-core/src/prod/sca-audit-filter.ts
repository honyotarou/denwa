/** SCA audit フィルタ（T-SEC-SCA-002/003）— allowlist なし */

import type { ScaAdvisory } from './sca-policy.js';

const BLOCKED_SEVERITIES = new Set(['moderate', 'high', 'critical']);

/** moderate+ advisory の説明を返す（空なら OK） */
export function collectBlockedAdvisories(advisories: readonly ScaAdvisory[]): readonly string[] {
  return advisories
    .filter((a) => BLOCKED_SEVERITIES.has(a.severity))
    .map((a) => `${a.name} (${a.severity}) via ${a.via.join(' > ')}`);
}
