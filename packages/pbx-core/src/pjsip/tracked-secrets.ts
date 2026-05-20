/** リポジトリ追跡の pjsip / DB で禁止する既定内線 secret（F-001 / F-017）— 単一正本 */

import forbiddenList from '../../forbidden-tracked-extension-passwords.json' with { type: 'json' };

export const PJSIP_SYNC_PLACEHOLDER = '__OPENPBX_SYNC__' as const;

/** トラッキング対象に残してはいけない平文（gate / prod-check と同期） */
export const FORBIDDEN_TRACKED_EXTENSION_PASSWORDS = forbiddenList as readonly string[];

export type ForbiddenTrackedExtensionPassword =
  (typeof FORBIDDEN_TRACKED_EXTENSION_PASSWORDS)[number];

const PASSWORD_LINE_RE = /^\s*password\s*=\s*(.+)\s*$/im;

function isForbiddenIniPasswordValue(value: string): boolean {
  const s = (value ?? '').trim();
  if (!s) return false;
  if ((FORBIDDEN_TRACKED_EXTENSION_PASSWORDS as readonly string[]).includes(s)) return true;
  if (/^ext-dev-\d+$/.test(s)) return true;
  return false;
}

/** DB / 本番: プレースホルダ・既定平文も禁止 */
export function isForbiddenExtensionSecret(secret: string): boolean {
  const s = (secret ?? '').trim();
  if (!s) return false;
  if (s === PJSIP_SYNC_PLACEHOLDER) return true;
  return isForbiddenIniPasswordValue(s);
}

/** 追跡 pjsip.ini 内の禁止 password= 値を列挙（プレースホルダは許可） */
export function findForbiddenTrackedExtensionPasswords(iniText: string): readonly string[] {
  const hits = new Set<string>();
  for (const line of iniText.split('\n')) {
    const m = line.match(/^\s*password\s*=\s*(\S+)\s*$/);
    if (!m) continue;
    const value = m[1]!.replace(/^["']|["']$/g, '');
    if (isForbiddenIniPasswordValue(value)) hits.add(value);
  }
  return [...hits];
}

/** 追跡 extensions.conf はプレースホルダのみ（実 secret は infra sync / bootstrap） */
export function isTrackedPjsipExtensionsPlaceholderOnly(iniText: string): boolean {
  const values: string[] = [];
  for (const line of iniText.split('\n')) {
    const m = line.match(PASSWORD_LINE_RE);
    if (m) values.push(m[1]!.trim().replace(/^["']|["']$/g, ''));
  }
  if (values.length === 0) return true;
  return values.every((v) => v === PJSIP_SYNC_PLACEHOLDER);
}
