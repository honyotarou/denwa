import type Database from 'better-sqlite3';
import { spawnSync } from 'node:child_process';
import { isUpgradeAutoExecEnabled, resolveCdrPollIntervalMs } from '@openpbx/core';
import { ingestCdrFile } from '@openpbx/infra/cdr/ingest';
import { getAppDb } from '../app-context';
import { processDueUpgrades } from '../services/upgrades-runner';
import path from 'node:path';

const PERIODIC_KEY = '__denwaPeriodicTasksStarted';

const CDR_POLL_MS = resolveCdrPollIntervalMs();
const UPGRADE_CHECK_MS = 60 * 1000;

export type PeriodicTasksOpts = Readonly<{
  db?: Database.Database;
  cdrCsvPath?: string;
  signalDir?: string;
  repoRoot?: string;
}>;

export function defaultCdrCsvPath(): string {
  return process.env.CDR_CSV_PATH ?? path.join(process.cwd(), 'data/asterisk-cdr/Master.csv');
}

export async function runCdrIngestTick(db: Database.Database, csvPath: string): Promise<void> {
  await ingestCdrFile(db, csvPath);
}

export function runUpgradeTick(
  db: Database.Database,
  signalDir: string,
  repoRoot: string,
  nowIso: string,
): void {
  const auto = isUpgradeAutoExecEnabled();
  void processDueUpgrades({
    db,
    repoRoot,
    signalDir,
    nowIso,
    autoExec: auto,
    spawn: auto
      ? (command, args, options) =>
          spawnSync(command, args, {
            cwd: options.cwd,
            encoding: options.encoding,
            timeout: options.timeout,
          })
      : undefined,
  });
}

/** CDR 取り込み・upgrade 監視（AMI 不要） */
export function ensurePeriodicTasks(opts?: PeriodicTasksOpts): void {
  const g = globalThis as typeof globalThis & { [PERIODIC_KEY]?: boolean };
  if (g[PERIODIC_KEY]) return;
  g[PERIODIC_KEY] = true;

  const db = opts?.db ?? getAppDb();
  const csvPath = opts?.cdrCsvPath ?? defaultCdrCsvPath();
  const signalDir = opts?.signalDir ?? path.join(process.cwd(), 'data/signals');
  const repoRoot = opts?.repoRoot ?? process.cwd();

  void runCdrIngestTick(db, csvPath);

  const cdrTimer = setInterval(() => {
    void runCdrIngestTick(db, csvPath);
  }, CDR_POLL_MS);

  const upgradeTick = () => runUpgradeTick(db, signalDir, repoRoot, new Date().toISOString());
  const upgradeTimer = setInterval(upgradeTick, UPGRADE_CHECK_MS);
  upgradeTick();

  for (const t of [cdrTimer, upgradeTimer]) {
    if (typeof t.unref === 'function') t.unref();
  }
}
