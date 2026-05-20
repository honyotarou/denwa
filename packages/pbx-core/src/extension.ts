import type { ExtensionNumber } from './brands.js';
import { parseExtensionNumber } from './brands.js';
import { validateIniFieldValue } from './ini/sanitize.js';

/** 内線番号・secret の検証（DB / UI / API 共通） — データと振る舞い分離 */

export const EXTENSION_NUMBER_RE = /^[0-9]{2,6}$/;

export type ExtensionDraft = Readonly<{
  number: ExtensionNumber;
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

export function validateExtensionNumber(number: string | ExtensionNumber): string | null {
  return parseExtensionNumber(number) ? null : '内線番号は 2〜6 桁の数字';
}

export function validateExtensionSecret(secret: string): string | null {
  if (!secret || secret.length < 4) return 'secret は 4 文字以上';
  return validateIniFieldValue(secret) ?? null;
}

export function validateExtensionDisplayName(displayName: string | null | undefined): string | null {
  if (displayName === undefined || displayName === null) return null;
  const trimmed = displayName.trim();
  if (trimmed === '') return null;
  return validateIniFieldValue(trimmed);
}

export function validateExtensionDraft(input: ExtensionDraftInput): string[] {
  const errs: string[] = [];
  const n = validateExtensionNumber(input.number);
  if (n) errs.push(n);
  const s = validateExtensionSecret(input.secret);
  if (s) errs.push(s);
  const d = validateExtensionDisplayName(input.displayName);
  if (d) errs.push(d);
  return errs;
}

/** 入力正規化（brand 化前） */
export function normalizeExtensionDraft(input: ExtensionDraftInput): ExtensionDraftInput {
  const display =
    input.displayName === undefined || input.displayName === null
      ? null
      : input.displayName.trim() === ''
        ? null
        : input.displayName;
  return {
    number: input.number.trim(),
    displayName: display,
    secret: input.secret,
    webrtc: Boolean(input.webrtc),
    pickupGroupNames: input.pickupGroupNames ?? [],
  };
}

/** validate 通過後にのみ呼ぶ */
export function toExtensionDraft(input: ExtensionDraftInput): ExtensionDraft {
  const number = parseExtensionNumber(input.number);
  if (!number) throw new Error(`invalid extension number: ${input.number}`);
  const normalized = normalizeExtensionDraft(input);
  return {
    number,
    displayName: normalized.displayName ?? null,
    secret: normalized.secret,
    webrtc: normalized.webrtc ?? false,
    pickupGroupNames: normalized.pickupGroupNames ?? [],
  };
}
