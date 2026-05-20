import path from 'node:path';

export type PathExists = (p: string) => boolean;

/** dev ソフトフォン: mkcert 証明書が揃っているか（T-SOFT-DEV-001） */
export function softphoneDevCertsReady(certsDir: string, exists: PathExists): boolean {
  const pem = path.join(certsDir, 'asterisk.pem');
  const key = path.join(certsDir, 'asterisk.key');
  return exists(pem) && exists(key);
}
