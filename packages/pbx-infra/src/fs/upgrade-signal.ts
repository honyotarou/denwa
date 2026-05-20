import fs from 'node:fs/promises';
import path from 'node:path';

export type UpgradeSignalPayload = Readonly<{
  upgradeId: number;
  asteriskImage: string;
  requestedAt: string;
}>;

/** ホスト側 upgrade-watcher 用シグナル（T-UPG-SIG-001） */
export async function writeUpgradeRunSignal(
  signalDir: string,
  payload: UpgradeSignalPayload,
): Promise<string> {
  const dir = path.resolve(signalDir);
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, 'upgrade-run');
  await fs.writeFile(file, `${JSON.stringify(payload)}\n`, 'utf8');
  return file;
}
