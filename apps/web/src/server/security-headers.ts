/** Next.js セキュリティヘッダ単一正本（T-SEC-HEADERS-001） */

export function buildSecurityHeaders(isProduction: boolean): Readonly<Record<string, string>> {
  const headers: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none'",
    'X-Content-Type-Options': 'nosniff',
  };
  if (isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  return headers;
}
