import { isAuthError } from '@/server/auth';

export function mapActionError(err: unknown): string {
  if (isAuthError(err)) {
    if (err.status === 403) return '権限がありません';
    if (err.status === 401) return 'ログインが必要です';
    return '認証に失敗しました';
  }
  if (err instanceof Error) {
    if (err.message === 'last admin') return '最後の管理者は変更できません';
    if (err.message === 'invalid cidr') return 'CIDR の形式が正しくありません';
    if (err.message === 'IP blocked') return 'この IP からはログインできません';
    if (err.message === 'invalid credentials') return 'ユーザー名またはパスワードが正しくありません';
    return err.message;
  }
  return '操作に失敗しました';
}

export function mapLoginError(code?: string): string {
  if (code === 'IP blocked') return 'この IP からはログインできません';
  return 'ユーザー名またはパスワードが正しくありません';
}
