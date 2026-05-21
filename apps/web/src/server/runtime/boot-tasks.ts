import { getAppDb } from '../app-context';
import { ensurePeriodicTasks } from './periodic-tasks';

const BOOT_KEY = '__denwaPeriodicBootStarted';

/** Node プロセス起動時に CDR/upgrade 定期タスクを開始（T-BOOT-001） */
export function ensurePeriodicTasksOnBoot(): void {
  if (process.env.VITEST) return;
  const g = globalThis as typeof globalThis & { [BOOT_KEY]?: boolean };
  if (g[BOOT_KEY]) return;
  g[BOOT_KEY] = true;
  ensurePeriodicTasks({ db: getAppDb() });
}
