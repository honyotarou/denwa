import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext, loginAsAdmin } from '../context';
import { handleInboxWavGet, ensureInboxFixture } from '../api/handlers/inbox';

const tmpDirs: string[] = [];

async function mkCtx() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cr-inbox-'));
  tmpDirs.push(dir);
  const inboxDir = path.join(dir, 'inbox');
  await fs.mkdir(inboxDir, { recursive: true });
  const ctx = createTestContext({
    infraDirs: {
      pjsipDir: path.join(dir, 'pjsip'),
      dialplanDir: path.join(dir, 'dialplan'),
      signalDir: path.join(dir, 'signals'),
      soundsDir: path.join(dir, 'sounds'),
      recordingsDir: path.join(dir, 'rec'),
    },
  });
  return { ctx, inboxDir };
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })));
});

describe('T-INBOX-API-001: inbox wav handler', () => {
  it('Given wav in inbox When GET Then stream 200', async () => {
    const { ctx, inboxDir } = await mkCtx();
    ctx.sessionToken = await loginAsAdmin(ctx);
    await ensureInboxFixture(inboxDir, 'evt.wav');
    const r = await handleInboxWavGet(ctx, 'evt.wav', { inboxDir });
    expect(r.status).toBe(200);
    expect(r.stream).toBeDefined();
  });

  it('Given traversal When GET Then 400', async () => {
    const { ctx, inboxDir } = await mkCtx();
    ctx.sessionToken = await loginAsAdmin(ctx);
    const r = await handleInboxWavGet(ctx, '../x.wav', { inboxDir });
    expect(r.status).toBe(400);
  });
});
