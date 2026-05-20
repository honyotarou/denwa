/** WebRTC 内線 credential の開示ポリシー（T-SOFT-001〜003） */

export type SoftphoneExtensionCred = Readonly<{
  number: string;
  secret: string;
  webrtc: boolean;
}>;

export type SoftphoneProfileOut = Readonly<{
  number: string;
  secret?: string;
}>;

export function filterSoftphoneProfiles(
  role: 'user' | 'supervisor' | 'admin',
  extensions: readonly SoftphoneExtensionCred[],
  grantedNumbers: readonly string[],
): SoftphoneProfileOut[] {
  const webrtc = extensions.filter((e) => e.webrtc);
  if (role === 'admin') {
    return webrtc.map((e) => ({ number: e.number, secret: e.secret }));
  }
  const grantSet = new Set(grantedNumbers);
  return webrtc
    .filter((e) => grantSet.has(e.number))
    .map((e) => ({ number: e.number, secret: e.secret }));
}
