import fs from 'node:fs';
import path from 'node:path';
import { isSafeInboxWavName } from '@openpbx/core';
import { invalidFilenameError, unsafePathError } from './errors.js';

/** T-INBOX-READ-002: inbox wav 読取（recordings と同型の traversal 拒否） */
export function resolveInboxWavPath(inboxDir: string, filename: string): string {
  if (!isSafeInboxWavName(filename)) {
    throw invalidFilenameError('invalid inbox wav filename');
  }
  const base = path.resolve(inboxDir);
  const full = path.join(base, filename);
  const resolved = path.resolve(full);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw unsafePathError('inbox path traversal');
  }
  return resolved;
}

export function openInboxWavStream(inboxDir: string, filename: string): fs.ReadStream {
  return fs.createReadStream(resolveInboxWavPath(inboxDir, filename));
}
