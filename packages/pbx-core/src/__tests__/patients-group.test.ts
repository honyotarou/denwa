import { describe, expect, it } from 'vitest';
import { groupPatientRecordsByDate } from '../patients/group-records.js';

describe('T-PAT-008: groupPatientRecordsByDate', () => {
  it('Given records on two days When group Then newest date first', () => {
    const groups = groupPatientRecordsByDate([
      { id: 1, recordedAt: '2026-05-19 10:00:00' },
      { id: 2, recordedAt: '2026-05-20 09:00:00' },
      { id: 3, recordedAt: '2026-05-20 15:00:00' },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.dateKey).toBe('2026-05-20');
    expect(groups[0]!.records.map((r) => r.id)).toEqual([2, 3]);
    expect(groups[1]!.dateKey).toBe('2026-05-19');
  });

  it('Given empty When group Then empty', () => {
    expect(groupPatientRecordsByDate([])).toEqual([]);
  });
});
