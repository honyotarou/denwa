import fs from 'node:fs/promises';
import path from 'node:path';
import { openRecordingReadStream, resolveRecordingPath } from '@openpbx/infra/fs/recording';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { withAuth } from '../with-auth';

export async function handleRecordingGet(
  ctx: AppContext,
  file: string,
): Promise<JsonHandlerResult> {
  return withAuth(ctx, () => {
    try {
      resolveRecordingPath(ctx.infraDirs.recordingsDir, file);
      const stream = openRecordingReadStream(ctx.infraDirs.recordingsDir, file);
      return { status: 200, stream };
    } catch {
      return { status: 400, body: { error: 'invalid filename' } };
    }
  });
}

export async function ensureRecordingFixture(ctx: AppContext, name: string): Promise<void> {
  const p = path.join(ctx.infraDirs.recordingsDir, name);
  await fs.mkdir(ctx.infraDirs.recordingsDir, { recursive: true });
  await fs.writeFile(p, Buffer.from('RIFFxxxxWAVE'));
}
