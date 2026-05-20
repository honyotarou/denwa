import fs from 'node:fs/promises';
import path from 'node:path';
import { unsafePathError } from './errors.js';

/** baseDir 配下への相対パスのみ許可（T-INFRA-003） */
export function resolveUnderBase(baseDir: string, relativePath: string): string {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, relativePath);
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw unsafePathError(`path escapes base: ${relativePath}`);
  }
  return target;
}

/** tmp → rename で原子書込（T-INFRA-001/002） */
export async function writeTextAtomic(
  baseDir: string,
  relativePath: string,
  content: string,
): Promise<string> {
  const target = resolveUnderBase(baseDir, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, target);
  return target;
}
