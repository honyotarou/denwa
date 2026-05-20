/** Branded types — 構造的部分型の混同を compile-time で防ぐ（§5.4.1） */

declare const extensionNumberBrand: unique symbol;
declare const ivrNumberBrand: unique symbol;
declare const usernameBrand: unique symbol;
declare const cidrBrand: unique symbol;
declare const sessionTokenBrand: unique symbol;

export type ExtensionNumber = string & { readonly [extensionNumberBrand]: true };
export type IvrNumber = string & { readonly [ivrNumberBrand]: true };
export type Username = string & { readonly [usernameBrand]: true };
export type Cidr = string & { readonly [cidrBrand]: true };
export type SessionToken = string & { readonly [sessionTokenBrand]: true };

const EXTENSION_NUMBER_RE = /^[0-9]{2,6}$/;
const USERNAME_RE = /^[a-zA-Z0-9._-]{1,64}$/;

function brand<T extends string>(value: string): T {
  return value as T;
}

export function parseExtensionNumber(raw: string): ExtensionNumber | null {
  const v = raw.trim();
  return EXTENSION_NUMBER_RE.test(v) ? brand<ExtensionNumber>(v) : null;
}

export function parseIvrNumber(raw: string): IvrNumber | null {
  const v = raw.trim();
  return EXTENSION_NUMBER_RE.test(v) ? brand<IvrNumber>(v) : null;
}

export function parseUsername(raw: string): Username | null {
  const v = raw.trim();
  return USERNAME_RE.test(v) ? brand<Username>(v) : null;
}

export function parseCidr(raw: string, validate: (c: string) => boolean): Cidr | null {
  const v = raw.trim();
  return validate(v) ? brand<Cidr>(v) : null;
}

export function parseSessionToken(raw: string): SessionToken | null {
  const v = raw.trim();
  return v.length >= 16 ? brand<SessionToken>(v) : null;
}

/** 検証済み値のみ brand（実行時チェック必須） */
export function assertExtensionNumber(raw: string): ExtensionNumber {
  const v = parseExtensionNumber(raw);
  if (!v) throw new Error(`invalid extension number: ${raw}`);
  return v;
}

export function assertIvrNumber(raw: string): IvrNumber {
  const v = parseIvrNumber(raw);
  if (!v) throw new Error(`invalid ivr number: ${raw}`);
  return v;
}
