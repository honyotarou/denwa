import type Database from 'better-sqlite3';
import { resolveConcurrencyPollIntervalMs } from '@openpbx/core';
import { recordConcurrencyFromDevices } from '@openpbx/infra';
import type { AmiDeviceSession } from '@openpbx/infra/ami/device-session';
import { getAppDb } from '../app-context';
import { ensurePeriodicTasks, type PeriodicTasksOpts } from './periodic-tasks';

const AMI_BG_KEY = '__denwaAmiBackgroundTasksStarted';

export type BackgroundTickDeps = Readonly<{
  db: Database.Database;
  session: AmiDeviceSession;
  now?: Date;
}>;

/** 単体テスト可能な concurrency 分足し（T-BG-001） */
export function runConcurrencyTick(deps: BackgroundTickDeps): void {
  if (!deps.session.isConnected()) return;
  recordConcurrencyFromDevices(deps.db, deps.session.getDevices(), deps.now);
}

export type StartBackgroundTasksOpts = PeriodicTasksOpts;

/** AMI + 定期タスク（CDR ingest は AMI 不要で periodic 側が担当） */
export function ensureBackgroundTasks(
  session: AmiDeviceSession,
  opts?: StartBackgroundTasksOpts,
): void {
  ensurePeriodicTasks(opts);

  const g = globalThis as typeof globalThis & { [AMI_BG_KEY]?: boolean };
  if (g[AMI_BG_KEY]) return;
  g[AMI_BG_KEY] = true;

  const db = opts?.db ?? getAppDb();
  const onConcurrency = () => runConcurrencyTick({ db, session });
  session.onChange(onConcurrency);
  onConcurrency();

  const concTimer = setInterval(onConcurrency, resolveConcurrencyPollIntervalMs());
  if (typeof concTimer.unref === 'function') concTimer.unref();
}
