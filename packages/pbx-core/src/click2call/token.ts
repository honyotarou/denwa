import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Bearer token 平文生成（返却は create 時のみ） */
export function generateClickToCallTokenPlain(): string {
  return randomBytes(32).toString('hex');
}

export function hashClickToCallToken(plain: string): string {
  return createHash('sha256').update(plain, 'utf8').digest('hex');
}

export function verifyClickToCallTokenPlain(plain: string, storedHash: string): boolean {
  const got = hashClickToCallToken(plain);
  try {
    return timingSafeEqual(Buffer.from(got, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

export function parseBearerAuthorization(header: string | null | undefined): string | null {
  if (!header) return null;
  const m = header.match(/^Bearer\s+(\S+)\s*$/i);
  return m ? m[1]! : null;
}

export function validateClickToCallTokenName(name: string): string | null {
  const n = (name ?? '').trim();
  if (n.length < 1 || n.length > 64) return '名前は 1〜64 文字';
  if (!/^[a-zA-Z0-9._\-]+$/.test(n)) return '名前に使用できない文字があります';
  return null;
}

/** T-CHX-014: token の from とリクエスト from が一致すること */
export function clickToCallFromMatchesToken(from: string, tokenFromExtension: string): boolean {
  return from.trim() === tokenFromExtension.trim();
}
