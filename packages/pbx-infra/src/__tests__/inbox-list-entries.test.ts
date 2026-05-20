import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { listInboxEntries } from '../inbox/list-entries.js';

describe('T-INBOX-UI-001: listInboxEntries', () => {
  it('Given meta+json When list Then newest first with parsed fields', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'inbox-'));
    await fs.writeFile(
      path.join(dir, 'a.meta.json'),
      JSON.stringify({
        kind: 'callback_request',
        extension: '9002',
        callerId: '090',
        receivedAt: '2026-05-20T00:00:00Z',
      }),
    );
    await fs.writeFile(path.join(dir, 'a.wav'), 'x');
    const rows = await listInboxEntries(dir);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.kind).toBe('callback_request');
    expect(rows[0]!.wavName).toBe('a.wav');
    await fs.rm(dir, { recursive: true });
  });
});
