/** Edge-safe: proxy IP only (no DB / Node path imports). */

function parseTrustedProxyCount(raw: string | undefined): number {
  const n = parseInt(raw ?? '0', 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function trustedProxyCountFromEnv(): number {
  return parseTrustedProxyCount(process.env.TRUSTED_PROXY_COUNT);
}

/**
 * Resolve client IP for allow-list checks.
 * Without trusted proxies, X-Forwarded-For is ignored (spoofing-safe).
 * With TRUSTED_PROXY_COUNT=N, use the Nth IP from the right of the XFF chain.
 */
export function resolveClientIp(headers: Headers, trusted = trustedProxyCountFromEnv()): string | undefined {
  if (trusted <= 0) return undefined;

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    // Require more than `trusted` hops so a lone spoofed XFF is ignored.
    if (parts.length > trusted) {
      const idx = parts.length - trusted;
      if (parts[idx]) return parts[idx];
    }
  }

  return headers.get('x-real-ip')?.trim() || undefined;
}

export function clientIpOptional(headers: Headers, trusted = trustedProxyCountFromEnv()): string | undefined {
  return resolveClientIp(headers, trusted);
}

export function clientIpFromHeaders(headers: Headers, trusted = trustedProxyCountFromEnv()): string {
  return clientIpOptional(headers, trusted) ?? '127.0.0.1';
}
