/** Chrome MV3 manifest 最小権限検証（T-CHX-006） */

const ALLOWED_PERMISSIONS = new Set(['storage', 'contextMenus']);
const FORBIDDEN_PERMISSIONS = new Set([
  'tabs',
  'webRequest',
  'webRequestBlocking',
  'cookies',
  'history',
  'bookmarks',
  'downloads',
]);

export type ChromeManifestInput = Readonly<{
  manifest_version?: number;
  permissions?: readonly string[];
  host_permissions?: readonly string[];
}>;

export function validateChromeExtensionManifest(m: ChromeManifestInput): string[] {
  const errs: string[] = [];
  if (m.manifest_version !== 3) errs.push('manifest_version must be 3');
  const perms = m.permissions ?? [];
  for (const p of perms) {
    if (FORBIDDEN_PERMISSIONS.has(p)) errs.push(`forbidden permission: ${p}`);
    if (!ALLOWED_PERMISSIONS.has(p)) errs.push(`unexpected permission: ${p}`);
  }
  if (!perms.includes('storage')) errs.push('storage permission required');
  return errs;
}
