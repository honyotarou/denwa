const NAME_RE = /^[A-Za-z0-9_/-]{1,80}$/;

export function validateGuidanceName(name: string): string | null {
  if (!NAME_RE.test(name)) return 'name は英数字 / _ / - / / のみ（1-80）';
  return null;
}

export function validateWavHeader(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return 'wav が短すぎる';
  const sig = Buffer.from(bytes.slice(0, 12)).toString('ascii');
  if (!sig.startsWith('RIFF') || !sig.includes('WAVE')) return 'wav RIFF ヘッダが見つかりません';
  return null;
}
