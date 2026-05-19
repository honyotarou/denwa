/** dialplan.d に書き出すファイル名の検証 */

const SAFE_NAME_RE = /^[a-zA-Z0-9._-]+\.conf$/;

export function validateDialplanFilename(name: string): string | null {
  if (!SAFE_NAME_RE.test(name)) return 'ファイル名は [a-zA-Z0-9._-]+.conf のみ';
  return null;
}

export function assertDialplanFilename(name: string): void {
  const err = validateDialplanFilename(name);
  if (err) throw new Error(`invalid dialplan filename: ${name}`);
}
