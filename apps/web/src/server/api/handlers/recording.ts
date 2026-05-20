import fs from 'node:fs/promises';
import path from 'node:path';
import { RECORDING_READ_MIN_ROLE } from '@openpbx/core';
import { openRecordingReadStream, resolveRecordingPath } from '@openpbx/infra/fs/recording';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { audit } from '../../audit';
import { withAuth } from '../with-auth';

export async function handleRecordingGet(
  ctx: AppContext,
  file: string,
): Promise<JsonHandlerResult> {
  return withAuth(
    ctx,
    (me) => {
      try {
        resolveRecordingPath(ctx.infraDirs.recordingsDir, file);
        audit(ctx, me, 'recording.read', file);
        const stream = openRecordingReadStream(ctx.infraDirs.recordingsDir, file);
        return { status: 200, stream };
      } catch {
        return { status: 400, body: { error: 'invalid filename' } };
      }
    },
    { minRole: RECORDING_READ_MIN_ROLE },
  );
}

export async function ensureRecordingFixture(ctx: AppContext, name: string): Promise<void> {
  const p = path.join(ctx.infraDirs.recordingsDir, name);
  await fs.mkdir(ctx.infraDirs.recordingsDir, { recursive: true });
  await fs.writeFile(p, Buffer.from('RIFFxxxxWAVE'));
}
