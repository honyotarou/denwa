import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { writeUpgradeRunSignal } from '../fs/upgrade-signal.js';

describe('T-UPG-SIG-001', () => {
  it('Given payload When write Then upgrade-run file', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sig-'));
    await writeUpgradeRunSignal(dir, {
      upgradeId: 3,
      asteriskImage: 'ast:2',
      requestedAt: '2026-05-20T00:00:00Z',
    });
    const raw = await fs.readFile(path.join(dir, 'upgrade-run'), 'utf8');
    expect(JSON.parse(raw)).toMatchObject({ upgradeId: 3 });
    await fs.rm(dir, { recursive: true });
  });
});
