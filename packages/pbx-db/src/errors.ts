/** DB 層の制約違反・リポジトリエラー */

export class DbError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'DbError';
    this.code = code;
  }
}

export class DuplicateError extends DbError {
  constructor(message: string) {
    super('DUPLICATE', message);
    this.name = 'DuplicateError';
  }
}

export class NotFoundError extends DbError {
  constructor(message: string) {
    super('NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ConstraintError extends DbError {
  constructor(message: string) {
    super('CONSTRAINT', message);
    this.name = 'ConstraintError';
  }
}
