/** POST API の Origin 検証 — 単一正本 */

export type PostOriginCheck = Readonly<{
  origin?: string | null;
  requestHost: string;
  secFetchSite?: string | null;
}>;

export function isAllowedPostOrigin(
  origin: string | null,
  requestHost: string,
  secFetchSite?: string | null,
): boolean {
  if (origin) {
    if (!requestHost) return false;
    try {
      const u = new URL(origin);
      return u.host === requestHost;
    } catch {
      return false;
    }
  }
  const site = (secFetchSite ?? '').toLowerCase();
  if (site === 'same-origin' || site === 'same-site') return true;
  return false;
}

export function isAllowedPostRequest(check: PostOriginCheck): boolean {
  return isAllowedPostOrigin(check.origin ?? null, check.requestHost, check.secFetchSite);
}
