export type UpgradeScheduleRow = Readonly<{
  id: number;
  scheduledAt: string;
  asteriskImage: string;
  webImage?: string | null;
}>;

/** 予約時刻 <= now のアップグレード（UTC ISO 比較） */
export function filterDueUpgrades(
  rows: readonly UpgradeScheduleRow[],
  nowIso: string,
): readonly UpgradeScheduleRow[] {
  const now = Date.parse(nowIso);
  if (Number.isNaN(now)) return [];
  return rows.filter((r) => {
    const t = Date.parse(r.scheduledAt);
    return !Number.isNaN(t) && t <= now;
  });
}

export function formatUpgradeRunCommands(
  row: UpgradeScheduleRow,
): readonly string[] {
  const lines = [
    `docker compose pull`,
    `# asterisk image tag: ${row.asteriskImage}`,
  ];
  if (row.webImage) lines.push(`# web image tag: ${row.webImage}`);
  lines.push(`docker compose up -d --build asterisk web`);
  return lines;
}
