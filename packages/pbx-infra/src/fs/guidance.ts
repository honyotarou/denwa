import fs from 'node:fs/promises';
import path from 'node:path';
import { invalidFilenameError } from './errors.js';
import { resolveUnderBase } from './atomic-write.js';

const NAME_RE = /^[A-Za-z0-9_/-]{1,80}$/;

/** T-INFRA-012: SOUNDS_DIR/name.wav */
export async function saveGuidanceWav(
  soundsDir: string,
  name: string,
  wavBytes: Uint8Array,
): Promise<string> {
  if (!NAME_RE.test(name)) throw invalidFilenameError('name は英数字 / _ / - / / のみ');
  if (wavBytes.length === 0) throw invalidFilenameError('wav が空');
  const sig = Buffer.from(wavBytes.slice(0, 12)).toString('ascii');
  if (!sig.startsWith('RIFF') || !sig.includes('WAVE')) {
    throw invalidFilenameError('wav RIFF ヘッダが見つかりません');
  }
  const out = resolveUnderBase(soundsDir, `${name}.wav`);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, wavBytes);
  return out;
}

/** T-GUID-DEL-001: DB 削除とセットで wav を除去 */
export async function deleteGuidanceWav(soundsDir: string, name: string): Promise<void> {
  if (!NAME_RE.test(name)) throw invalidFilenameError('name は英数字 / _ / - / / のみ');
  const out = resolveUnderBase(soundsDir, `${name}.wav`);
  try {
    await fs.unlink(out);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }
}
