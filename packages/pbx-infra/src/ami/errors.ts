export type AmiOriginateErrorCode = 'LOGIN_FAILED' | 'ORIGINATE_FAILED' | 'TIMEOUT';

export type AmiOriginateErrorFields = Readonly<{
  tag: 'ami_originate';
  code: AmiOriginateErrorCode;
}>;

export type AmiOriginateError = Error & AmiOriginateErrorFields;

export function amiOriginateError(code: AmiOriginateErrorCode, message: string): AmiOriginateError {
  const e = new Error(message) as AmiOriginateError;
  e.name = 'AmiOriginateError';
  Object.assign(e, { tag: 'ami_originate' as const, code });
  return e;
}

export function isAmiOriginateError(e: unknown): e is AmiOriginateError {
  return typeof e === 'object' && e !== null && (e as AmiOriginateErrorFields).tag === 'ami_originate';
}
