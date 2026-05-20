import fs from 'node:fs';
import path from 'node:path';
import { InvalidFilenameError, UnsafePathError } from './errors.js';

const SAFE_RECORDING_NAME = /^[A-Za-z0-9._-]+\.wav$/;

/** T-INFRA-013: traversal 拒否 + 安全な basename のみ */
export function resolveRecordingPath(recordingsDir: string, filename: string): string {
  if (!SAFE_RECORDING_NAME.test(filename)) {
    throw new InvalidFilenameError('invalid recording filename');
  }
  const base = path.resolve(recordingsDir);
  const full = path.join(base, filename);
  const resolved = path.resolve(full);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new UnsafePathError('recording path traversal');
  }
  return resolved;
}

export function openRecordingReadStream(recordingsDir: string, filename: string): fs.ReadStream {
  const resolved = resolveRecordingPath(recordingsDir, filename);
  return fs.createReadStream(resolved);
}
