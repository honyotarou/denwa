export type PasswordPolicy = Readonly<{
  minLength: number;
  requireLowercase: boolean;
  requireUppercase: boolean;
  requireDigit: boolean;
  requireSymbol: boolean;
}>;

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireLowercase: true,
  requireUppercase: false,
  requireDigit: true,
  requireSymbol: false,
};

export function validatePasswordAgainstPolicy(
  plain: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
): string[] {
  const errs: string[] = [];
  if (plain.length < policy.minLength) errs.push(`${policy.minLength} 文字以上`);
  if (policy.requireLowercase && !/[a-z]/.test(plain)) errs.push('小文字を含む');
  if (policy.requireUppercase && !/[A-Z]/.test(plain)) errs.push('大文字を含む');
  if (policy.requireDigit && !/\d/.test(plain)) errs.push('数字を含む');
  if (policy.requireSymbol && !/[^A-Za-z0-9]/.test(plain)) errs.push('記号を含む');
  return errs;
}

const CIDR_RE = /^([0-9]{1,3}\.){3}[0-9]{1,3}\/(\d|[12]\d|3[0-2])$/;

function validIpv4Octets(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d{1,3}$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
}

export function isValidCidr(cidr: string): boolean {
  if (!CIDR_RE.test(cidr)) return false;
  const [base, bits] = cidr.split('/');
  if (!validIpv4Octets(base)) return false;
  const b = Number(bits);
  return b >= 0 && b <= 32;
}

/** allow list が空なら全許可。IPv4 のみ。 */
export function isIpAllowed(
  ip: string | undefined | null,
  allowCidrs: readonly string[],
): boolean {
  if (allowCidrs.length === 0) return true;
  if (!ip) return false;
  return allowCidrs.some((cidr) => cidrMatchIpv4(ip, cidr));
}

function cidrMatchIpv4(ip: string, cidr: string): boolean {
  const [base, bits] = cidr.split('/');
  const mask = (~0 << (32 - Number(bits))) >>> 0;
  const a = ipv4ToUInt(ip);
  const b = ipv4ToUInt(base);
  if (a === null || b === null) return false;
  return (a & mask) === (b & mask);
}

function ipv4ToUInt(ip: string): number | null {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}
