/** Edge-safe: proxy IP only (no DB / Node path imports). */

export function clientIpOptional(headers: Headers): string | undefined {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return headers.get('x-real-ip')?.trim() || undefined;
}

export function clientIpFromHeaders(headers: Headers): string {
  return clientIpOptional(headers) ?? '127.0.0.1';
}
