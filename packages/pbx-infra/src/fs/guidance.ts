import fs from 'node:fs/promises';
import path from 'node:path';
import { InvalidFilenameError } from './errors.js';
import { resolveUnderBase } from './atomic-write.js';

const NAME_RE = /^[A-Za-z0-9_/-]{1,80}$/;

/** T-INFRA-012: SOUNDS_DIR/name.wav */
export async function saveGuidanceWav(
  soundsDir: string,
  name: string,
  wavBytes: Uint8Array,
): Promise<string> {
  if (!NAME_RE.test(name)) throw new InvalidFilenameError('name は英数字 / _ / - / / のみ');
  if (wavBytes.length === 0) throw new InvalidFilenameError('wav が空');
  const sig = Buffer.from(wavBytes.slice(0, 12)).toString('ascii');
  if (!sig.startsWith('RIFF') || !sig.includes('WAVE')) {
    throw new InvalidFilenameError('wav RIFF ヘッダが見つかりません');
  }
  const out = resolveUnderBase(soundsDir, `${name}.wav`);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, wavBytes);
  return out;
}
