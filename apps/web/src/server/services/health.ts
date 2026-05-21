import { pingDatabase } from '@openpbx/db';
import { getAppDb } from '../app-context';

export type HealthStatus = Readonly<{
  ok: boolean;
  db: boolean;
}>;

/** T-HEALTH-001: アプリ + SQLite */
export function checkHealth(): HealthStatus {
  const dbOk = pingDatabase(getAppDb());
  return { ok: dbOk, db: dbOk };
}
