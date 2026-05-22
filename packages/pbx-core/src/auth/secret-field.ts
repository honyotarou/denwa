/** Secret フォーム/API のマスク・更新時保持 — 単一正本 */

export const SECRET_MASK_DISPLAY = '••••';

export function isSecretMaskDisplay(value: string): boolean {
  return value.trim() === SECRET_MASK_DISPLAY;
}

/** 更新時: 空・マスクなら existing を保持。新規は trimmed をそのまま返す。 */
export function resolveSecretOnUpdate(
  submitted: string | null | undefined,
  existing: string | null | undefined,
): string {
  const trimmed = submitted?.trim() ?? '';
  if (!trimmed || isSecretMaskDisplay(trimmed)) {
    return existing ?? trimmed;
  }
  return trimmed;
}
