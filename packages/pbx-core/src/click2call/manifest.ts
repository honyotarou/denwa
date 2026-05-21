/** Chrome MV3 manifest 最小権限検証（T-CHX-006 / T-SEC-EXT-001/002） */

const ALLOWED_PERMISSIONS = new Set(['storage', 'contextMenus', 'scripting']);
const FORBIDDEN_PERMISSIONS = new Set([
  'tabs',
  'webRequest',
  'webRequestBlocking',
  'cookies',
  'history',
  'bookmarks',
  'downloads',
]);

const FORBIDDEN_HOST_PATTERNS = [
  /^<all_urls>$/,
  /^https:\/\/\*\/\*$/,
  /^http:\/\/\*\/\*$/,
  /:\/\/\*\/\*/,
] as const;

export type ChromeManifestInput = Readonly<{
  manifest_version?: number;
  permissions?: readonly string[];
  host_permissions?: readonly string[];
  optional_host_permissions?: readonly string[];
  content_scripts?: ReadonlyArray<{ matches?: readonly string[] }>;
}>;

export function validateExtensionHostPattern(pattern: string): string | null {
  const p = (pattern ?? '').trim();
  if (!p) return 'empty host pattern';
  for (const re of FORBIDDEN_HOST_PATTERNS) {
    if (re.test(p)) return `forbidden host pattern: ${p}`;
  }
  if (!/^https?:\/\/[^*]+\/\*$/.test(p) && !/^https?:\/\/127\.0\.0\.1:\d+\/\*$/.test(p)) {
    return `host pattern must be explicit origin/*: ${p}`;
  }
  return null;
}

export function validateChromeExtensionManifest(m: ChromeManifestInput): string[] {
  const errs: string[] = [];
  if (m.manifest_version !== 3) errs.push('manifest_version must be 3');
  const perms = m.permissions ?? [];
  for (const p of perms) {
    if (FORBIDDEN_PERMISSIONS.has(p)) errs.push(`forbidden permission: ${p}`);
    if (!ALLOWED_PERMISSIONS.has(p)) errs.push(`unexpected permission: ${p}`);
  }
  if (!perms.includes('storage')) errs.push('storage permission required');
  for (const h of m.host_permissions ?? []) {
    const e = validateExtensionHostPattern(h);
    if (e) errs.push(e);
  }
  for (const h of m.optional_host_permissions ?? []) {
    const e = validateExtensionHostPattern(h);
    if (e) errs.push(`optional: ${e}`);
  }
  for (const cs of m.content_scripts ?? []) {
    for (const match of cs.matches ?? []) {
      const e = validateExtensionHostPattern(match);
      if (e) errs.push(`content_scripts: ${e}`);
    }
  }
  return errs;
}

/** bundled JS が storage.sync を使わない（T-SEC-EXT-002） */
export function validateExtensionUsesLocalStorage(source: string): string[] {
  const errs: string[] = [];
  if (/chrome\.storage\.sync/.test(source)) errs.push('must use chrome.storage.local not sync');
  return errs;
}
