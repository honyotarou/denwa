/** Next.js セキュリティヘッダ単一正本（T-SEC-HEADERS-001 / T-SEC-CSP-001） */

import {
  buildContentSecurityPolicy,
  type ContentSecurityPolicyOptions,
} from '@openpbx/core/prod/content-security-policy';

export { buildContentSecurityPolicy };

export function buildSecurityHeaders(
  isProduction: boolean,
  cspOptions?: ContentSecurityPolicyOptions,
): Readonly<Record<string, string>> {
  const headers: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': buildContentSecurityPolicy(cspOptions),
    'X-Content-Type-Options': 'nosniff',
  };
  if (isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  return headers;
}
