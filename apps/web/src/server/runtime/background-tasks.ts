import type Database from 'better-sqlite3';
import { filterDueUpgrades } from '@openpbx/core';
import { ingestCdrFile, recordConcurrencyFromDevices } from '@openpbx/infra';
import { listVersionUpgrades, recordAudit } from '@openpbx/db';
import type { AmiDeviceSession } from '@openpbx/infra/ami/device-session';
import { getAppDb } from '../app-context';
import path from 'node:path';

const GLOBAL_KEY = '__denwaBackgroundTasksStarted';

const CDR_POLL_MS = 5 * 60 * 1000;
const CONCURRENCY_TICK_MS = 60 * 1000;
const UPGRADE_CHECK_MS = 60 * 1000;

export type BackgroundTickDeps = Readonly<{
  db: Database.Database;
  session: AmiDeviceSession;
  now?: Date;
}>;

export function defaultCdrCsvPath(): string {
  return process.env.CDR_CSV_PATH ?? path.join(process.cwd(), 'data/asterisk-cdr/Master.csv');
}

/** 単体テスト可能な concurrency 分足し（T-BG-001） */
export function runConcurrencyTick(deps: BackgroundTickDeps): void {
  if (!deps.session.isConnected()) return;
  recordConcurrencyFromDevices(deps.db, deps.session.getDevices(), deps.now);
}

export async function runCdrIngestTick(db: Database.Database, csvPath: string): Promise<void> {
  await ingestCdrFile(db, csvPath);
}

export function runDueUpgradeAudit(db: Database.Database, nowIso: string): number {
  const due = filterDueUpgrades(listVersionUpgrades(db), nowIso);
  for (const row of due) {
    recordAudit(db, {
      actor: 'system',
      action: 'upgrade.due',
      target: String(row.id),
      details: { asteriskImage: row.asteriskImage },
    });
  }
  return due.length;
}

export type StartBackgroundTasksOpts = Readonly<{
  db?: Database.Database;
  cdrCsvPath?: string;
}>;

/** AMI セッション起動時に一度だけバックグラウンド処理を登録 */
export function ensureBackgroundTasks(
  session: AmiDeviceSession,
  opts?: StartBackgroundTasksOpts,
): void {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: boolean };
  if (g[GLOBAL_KEY]) return;
  g[GLOBAL_KEY] = true;

  const db = opts?.db ?? getAppDb();
  const csvPath = opts?.cdrCsvPath ?? defaultCdrCsvPath();

  const onConcurrency = () => runConcurrencyTick({ db, session });
  session.onChange(onConcurrency);
  onConcurrency();

  const cdrTimer = setInterval(() => {
    void runCdrIngestTick(db, csvPath);
  }, CDR_POLL_MS);
  void runCdrIngestTick(db, csvPath);

  const concTimer = setInterval(onConcurrency, CONCURRENCY_TICK_MS);

  const upgradeTimer = setInterval(() => {
    runDueUpgradeAudit(db, new Date().toISOString());
  }, UPGRADE_CHECK_MS);
  runDueUpgradeAudit(db, new Date().toISOString());

  for (const t of [cdrTimer, concTimer, upgradeTimer]) {
    if (typeof t.unref === 'function') t.unref();
  }
}
