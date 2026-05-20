import fs from 'node:fs/promises';
import path from 'node:path';
import { assertDialplanFilename } from '@openpbx/core';
import { writeTextAtomic } from './atomic-write.js';

export async function writeDialplanFile(
  dialplanDir: string,
  name: string,
  content: string,
): Promise<string> {
  assertDialplanFilename(name);
  return writeTextAtomic(dialplanDir, name, content);
}

export async function signalAsteriskReload(signalDir: string): Promise<string> {
  const dir = path.resolve(signalDir);
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, 'reload');
  const stamp = String(Date.now());
  await fs.writeFile(file, stamp, 'utf8');
  return stamp;
}
