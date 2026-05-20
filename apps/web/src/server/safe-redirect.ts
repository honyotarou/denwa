/** Post-login redirect: same-origin relative paths only (T-SEC-003). */

export function safeRedirectPath(raw: string | null | undefined, fallback = '/'): string {
  const url = (raw ?? '').trim();
  if (!url) return fallback;
  if (!url.startsWith('/') || url.startsWith('//')) return fallback;
  if (url.includes('\\')) return fallback;
  if (/[\x00-\x1f]/.test(url)) return fallback;
  return url;
}
