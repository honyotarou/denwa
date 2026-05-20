export type FsErrorKind = 'unsafe_path' | 'invalid_filename';

export type FsErrorFields = Readonly<{ kind: FsErrorKind }>;
export type FsError = Error & FsErrorFields;

function fsError(kind: FsErrorKind, message: string, name: string): FsError {
  const e = new Error(message) as FsError;
  e.name = name;
  Object.assign(e, { kind });
  return e;
}

export function unsafePathError(message: string): FsError {
  return fsError('unsafe_path', message, 'UnsafePathError');
}

export function invalidFilenameError(message: string): FsError {
  return fsError('invalid_filename', message, 'InvalidFilenameError');
}

export function isUnsafePathError(e: unknown): e is FsError {
  return typeof e === 'object' && e !== null && (e as FsErrorFields).kind === 'unsafe_path';
}

export function isInvalidFilenameError(e: unknown): e is FsError {
  return typeof e === 'object' && e !== null && (e as FsErrorFields).kind === 'invalid_filename';
}
