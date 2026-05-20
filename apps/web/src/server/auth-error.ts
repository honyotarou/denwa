/** 認証エラー — class なし（tag 判別。instanceof 不可） */

export type AuthErrorFields = Readonly<{ tag: 'auth'; status: number }>;
export type AuthError = Error & AuthErrorFields;

export function authError(status: number, message: string): AuthError {
  const e = new Error(message) as AuthError;
  e.name = 'AuthError';
  Object.assign(e, { tag: 'auth' as const, status });
  return e;
}

export function isAuthError(e: unknown): e is AuthError {
  return typeof e === 'object' && e !== null && (e as AuthErrorFields).tag === 'auth';
}
