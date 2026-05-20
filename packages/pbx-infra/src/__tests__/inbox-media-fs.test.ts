import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { openInboxWavStream, resolveInboxWavPath } from '../fs/inbox-media.js';

describe('T-INBOX-READ-002: inbox wav fs', () => {
  it('Given wav When resolve Then absolute path under inbox dir', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'inbox-wav-'));
    await fs.writeFile(path.join(dir, 'ev.wav'), 'RIFF');
    const p = resolveInboxWavPath(dir, 'ev.wav');
    expect(p).toContain('ev.wav');
    const stream = openInboxWavStream(dir, 'ev.wav');
    expect(stream).toBeDefined();
    stream.destroy();
    await fs.rm(dir, { recursive: true });
  });

  it('Given traversal When resolve Then throw', () => {
    expect(() => resolveInboxWavPath('/inbox', '../x.wav')).toThrow();
  });
});
