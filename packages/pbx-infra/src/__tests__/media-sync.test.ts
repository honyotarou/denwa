import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { applySchema } from '@openpbx/db';
import Database from 'better-sqlite3';
import { syncRecordingFilesIndex } from '../media/sync-recordings.js';
import { deleteGuidanceWav, saveGuidanceWav } from '../fs/guidance.js';

describe('T-MEDIA-SYNC-001', () => {
  it('Given wav dir When sync Then recording_files', async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'rec-sync-'));
    await fs.writeFile(path.join(base, '9.0-1001-to-1002.wav'), 'RIFFxxxxWAVEdata');
    const db = new Database(':memory:');
    applySchema(db);
    const n = await syncRecordingFilesIndex(db, base);
    expect(n).toBe(1);
    const row = db.prepare('SELECT uniqueid FROM recording_files WHERE name = ?').get('9.0-1001-to-1002.wav') as {
      uniqueid: string;
    };
    expect(row.uniqueid).toBe('9.0');
  });
});

describe('T-GUID-DEL-001', () => {
  it('Given wav When deleteGuidanceWav Then removed', async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'guid-del-'));
    const wav = new Uint8Array(Buffer.from('RIFFxxxxWAVEdata'));
    await saveGuidanceWav(base, 'welcome', wav);
    await deleteGuidanceWav(base, 'welcome');
    await expect(fs.stat(path.join(base, 'welcome.wav'))).rejects.toThrow();
  });
});
