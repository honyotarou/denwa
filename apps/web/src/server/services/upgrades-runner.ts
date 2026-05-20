import type Database from 'better-sqlite3';
import { isUpgradeAutoExecEnabled } from '@openpbx/core';
import { listDueUnappliedUpgrades, markUpgradeApplied, recordAudit } from '@openpbx/db';
import { writeUpgradeRunSignal } from '@openpbx/infra';
import { executeScheduledUpgrade, type SpawnSyncLike } from '@openpbx/ops/upgrades/compose-exec';

export type ProcessDueUpgradesDeps = Readonly<{
  db: Database.Database;
  repoRoot: string;
  signalDir: string;
  nowIso: string;
  autoExec?: boolean;
  spawn?: SpawnSyncLike;
}>;

/** 期限到来かつ未適用の upgrade を処理（T-UPG-RUN-001） */
export async function processDueUpgrades(deps: ProcessDueUpgradesDeps): Promise<number> {
  const due = listDueUnappliedUpgrades(deps.db, deps.nowIso);
  const auto = deps.autoExec ?? isUpgradeAutoExecEnabled();
  let processed = 0;

  for (const row of due) {
    await writeUpgradeRunSignal(deps.signalDir, {
      upgradeId: row.id,
      asteriskImage: row.asteriskImage,
      requestedAt: deps.nowIso,
    });

    if (auto && deps.spawn) {
      const result = executeScheduledUpgrade(deps.repoRoot, row, deps.spawn);
      recordAudit(deps.db, {
        actor: 'system',
        action: result.ok ? 'upgrade.apply' : 'upgrade.apply.failed',
        target: String(row.id),
        details: { stderr: result.stderr.slice(0, 500) },
      });
      if (result.ok) {
        markUpgradeApplied(deps.db, row.id);
        processed++;
        continue;
      }
    }

    recordAudit(deps.db, {
      actor: 'system',
      action: 'upgrade.due',
      target: String(row.id),
      details: { asteriskImage: row.asteriskImage, autoExec: auto },
    });
  }

  return processed;
}
