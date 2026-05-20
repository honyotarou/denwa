/** アップグレード自動実行の環境ゲート（本番デフォルト OFF） */
export function isUpgradeAutoExecEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return env.ALLOW_UPGRADE_EXEC === '1';
}
