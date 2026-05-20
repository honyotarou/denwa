/** 内線番号・secret の検証（DB / UI / API 共通） */

export const EXTENSION_NUMBER_RE = /^[0-9]{2,6}$/;

export type ExtensionDraft = Readonly<{
  number: string;
  displayName: string | null;
  secret: string;
  webrtc: boolean;
  pickupGroupNames: readonly string[];
}>;

export type ExtensionDraftInput = Readonly<{
  number: string;
  displayName?: string | null;
  secret: string;
  webrtc?: boolean;
  pickupGroupNames?: readonly string[];
}>;

export function validateExtensionNumber(number: string): string | null {
  if (!EXTENSION_NUMBER_RE.test(number)) return '内線番号は 2〜6 桁の数字';
  return null;
}

export function validateExtensionSecret(secret: string): string | null {
  if (!secret || secret.length < 4) return 'secret は 4 文字以上';
  if (/["\\\n\r]/.test(secret)) return 'secret に引用符・改行は使えません';
  return null;
}

export function validateExtensionDraft(draft: ExtensionDraft): string[] {
  const errs: string[] = [];
  const n = validateExtensionNumber(draft.number);
  if (n) errs.push(n);
  const s = validateExtensionSecret(draft.secret);
  if (s) errs.push(s);
  return errs;
}

/** T-EXT-006/007: 空 display は null、webrtc は boolean */
export function normalizeExtensionDraft(input: ExtensionDraftInput): ExtensionDraft {
  const display =
    input.displayName === undefined || input.displayName === null
      ? null
      : input.displayName.trim() === ''
        ? null
        : input.displayName;
  return {
    number: input.number,
    displayName: display,
    secret: input.secret,
    webrtc: Boolean(input.webrtc),
    pickupGroupNames: input.pickupGroupNames ?? [],
  };
}
