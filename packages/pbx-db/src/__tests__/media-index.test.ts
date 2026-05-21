import { describe, expect, it } from 'vitest';
import { createInMemoryDb, upsertRecordingFile, listRecordingLinksByUniqueid } from '../index.js';

describe('T-MEDIA-DB-001: recording_files', () => {
  it('Given upsert When list links Then uniqueid map', () => {
    const db = createInMemoryDb();
    upsertRecordingFile(db, { name: 'a.wav', uniqueid: '1.0', sizeBytes: 100 });
    expect(listRecordingLinksByUniqueid(db)).toEqual([{ uniqueid: '1.0', name: 'a.wav' }]);
  });
});
