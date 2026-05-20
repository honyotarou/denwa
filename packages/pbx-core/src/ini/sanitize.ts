/** Asterisk ini 断片向け値の単一正本（PJSIP / dialplan 共通） */

const INI_UNSAFE_RE = /["\\\n\r\[\];=]/;

export function validateIniFieldValue(value: string): string | null {
  if (INI_UNSAFE_RE.test(value)) return 'ini 不正文字（引用符・改行・[];=）';
  return null;
}

export function sanitizeIniDisplayName(displayName: string | null, fallback: string): string {
  const base = (displayName ?? fallback).trim();
  if (validateIniFieldValue(base)) return fallback.replace(INI_UNSAFE_RE, '');
  return base.replace(/"/g, '');
}
