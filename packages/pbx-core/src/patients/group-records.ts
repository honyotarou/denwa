/** 患者記録を日付キーでグループ（T-PAT-008） */

export type PatientRecordDateGroup<T> = Readonly<{
  dateKey: string;
  records: readonly T[];
}>;

/** recordedAt の先頭 10 文字 (YYYY-MM-DD) でグループ。新しい日付が先。 */
export function groupPatientRecordsByDate<T extends { recordedAt: string }>(
  records: readonly T[],
): readonly PatientRecordDateGroup<T>[] {
  const byDate = new Map<string, T[]>();
  for (const r of records) {
    const dateKey = r.recordedAt.slice(0, 10);
    const list = byDate.get(dateKey);
    if (list) list.push(r);
    else byDate.set(dateKey, [r]);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, recs]) => ({ dateKey, records: recs }));
}
