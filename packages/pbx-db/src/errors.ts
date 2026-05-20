/** DB 層エラー — class なし・判別 tag（実行時 instanceof 不可に留意） */

export type DbErrorKind = 'duplicate' | 'not_found' | 'constraint';

export type DbErrorFields = Readonly<{
  kind: DbErrorKind;
  code: string;
}>;

export type DbError = Error & DbErrorFields;

function dbError(kind: DbErrorKind, code: string, message: string): DbError {
  const e = new Error(message) as DbError;
  e.name =
    kind === 'duplicate' ? 'DuplicateError' : kind === 'not_found' ? 'NotFoundError' : 'ConstraintError';
  Object.assign(e, { kind, code });
  return e;
}

export function duplicateError(message: string): DbError {
  return dbError('duplicate', 'DUPLICATE', message);
}

export function notFoundError(message: string): DbError {
  return dbError('not_found', 'NOT_FOUND', message);
}

export function constraintError(message: string): DbError {
  return dbError('constraint', 'CONSTRAINT', message);
}

export function isDbError(e: unknown, kind?: DbErrorKind): e is DbError {
  if (typeof e !== 'object' || e === null) return false;
  const k = (e as DbErrorFields).kind;
  if (k !== 'duplicate' && k !== 'not_found' && k !== 'constraint') return false;
  return kind === undefined || k === kind;
}

export function isDuplicateError(e: unknown): e is DbError {
  return isDbError(e, 'duplicate');
}

export function isNotFoundError(e: unknown): e is DbError {
  return isDbError(e, 'not_found');
}

export function isConstraintError(e: unknown): e is DbError {
  return isDbError(e, 'constraint');
}

/** @deprecated use isDuplicateError — instanceof 互換なし */
export type DuplicateError = DbError;
export type NotFoundError = DbError;
export type ConstraintError = DbError;
