import path from 'node:path';
import { invalidFilenameError } from './errors.js';
import { writeTextAtomic } from './atomic-write.js';

const PJSIP_NAME_RE = /^[a-zA-Z0-9._-]+\.conf$/;

/** pjsip.d 配下にのみ書く（T-INFRA-005） */
export async function writePjsipFile(
  pjsipDir: string,
  filename: string,
  content: string,
): Promise<string> {
  if (!PJSIP_NAME_RE.test(filename)) {
    throw invalidFilenameError(`invalid pjsip filename: ${filename}`);
  }
  const base = path.resolve(pjsipDir);
  return writeTextAtomic(base, filename, content);
}
