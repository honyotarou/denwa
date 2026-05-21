/** Next.js セキュリティヘッダ単一正本（T-SEC-HEADERS-001） */

import { buildContentSecurityPolicy } from '@openpbx/core/prod/content-security-policy';

export { buildContentSecurityPolicy };

export function buildSecurityHeaders(isProduction: boolean): Readonly<Record<string, string>> {
  const headers: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Next.js App Router は RSC ブートストラップに inline script が必要（nonce 未導入）
    'Content-Security-Policy': buildContentSecurityPolicy(),
    'X-Content-Type-Options': 'nosniff',
  };
  if (isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  return headers;
}
