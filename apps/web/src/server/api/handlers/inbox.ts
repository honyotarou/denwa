import fs from 'node:fs/promises';
import path from 'node:path';
import { INBOX_READ_MIN_ROLE } from '@openpbx/core';
import { openInboxWavStream } from '@openpbx/infra/fs/inbox-media';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { audit } from '../../audit';
import { withAuth } from '../with-auth';
import { inboxDirectory } from '../../paths';

export type InboxWavDeps = Readonly<{
  inboxDir?: string;
}>;

export async function handleInboxWavGet(
  ctx: AppContext,
  file: string,
  deps: InboxWavDeps = {},
): Promise<JsonHandlerResult> {
  const inboxDir = deps.inboxDir ?? inboxDirectory();
  return withAuth(
    ctx,
    (me) => {
      try {
        const stream = openInboxWavStream(inboxDir, file);
        audit(ctx, me, 'inbox.read', file);
        return { status: 200, stream };
      } catch {
        return { status: 400, body: { error: 'invalid filename' } };
      }
    },
    { minRole: INBOX_READ_MIN_ROLE },
  );
}

export async function ensureInboxFixture(inboxDir: string, name: string): Promise<void> {
  await fs.mkdir(inboxDir, { recursive: true });
  await fs.writeFile(path.join(inboxDir, name), Buffer.from('RIFFxxxxWAVE'));
}
