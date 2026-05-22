/** レートリミット key 組み立て — IP rotation 緩和（T-SEC-RATE-003） */

export function rateLimitKeyForIp(ip: string | undefined): string {
  return ip?.trim() || 'unknown';
}

export function rateLimitKeyForSessionToken(token: string | null | undefined): string {
  const t = token?.trim();
  return t ? t.slice(0, 32) : 'anonymous';
}

/** Bearer token は hash のみ（IP 非依存） */
export function rateLimitKeyForBearerToken(
  plainToken: string,
  hashToken: (plain: string) => string,
): string {
  return hashToken(plainToken.trim());
}
