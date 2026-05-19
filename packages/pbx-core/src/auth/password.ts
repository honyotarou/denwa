import crypto from 'node:crypto';

const SCRYPT_N = 1 << 15;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(plain, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });
  return `$scrypt$N=${SCRYPT_N}$r=${SCRYPT_R}$p=${SCRYPT_P}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  try {
    const parts = stored.split('$');
    if (parts.length < 7 || parts[1] !== 'scrypt') return false;
    const N = Number(parts[2].split('=')[1]);
    const r = Number(parts[3].split('=')[1]);
    const p = Number(parts[4].split('=')[1]);
    const salt = Buffer.from(parts[5], 'hex');
    const hash = Buffer.from(parts[6], 'hex');
    const got = crypto.scryptSync(plain, salt, hash.length, { N, r, p, maxmem: SCRYPT_MAXMEM });
    return crypto.timingSafeEqual(got, hash);
  } catch {
    return false;
  }
}
