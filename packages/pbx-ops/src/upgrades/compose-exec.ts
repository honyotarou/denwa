import type { UpgradeScheduleRow } from '@openpbx/core';

export type SpawnSyncLike = (
  command: string,
  args: readonly string[],
  options: { cwd: string; encoding: 'utf8'; timeout: number },
) => { status: number | null; stdout?: string; stderr?: string };

export type ComposeExecResult = Readonly<{
  ok: boolean;
  code: number;
  stdout: string;
  stderr: string;
}>;

export function runComposeInRepo(
  repoRoot: string,
  composeArgs: readonly string[],
  spawnImpl: SpawnSyncLike,
): ComposeExecResult {
  const r = spawnImpl('docker', ['compose', ...composeArgs], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 600_000,
  });
  return {
    ok: r.status === 0,
    code: r.status ?? 1,
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
  };
}

/** 期限到来 upgrade 1 件を compose pull + up で適用（T-UPG-EXEC-002） */
export function executeScheduledUpgrade(
  repoRoot: string,
  _row: UpgradeScheduleRow,
  spawnImpl: SpawnSyncLike,
): ComposeExecResult {
  const pull = runComposeInRepo(repoRoot, ['pull'], spawnImpl);
  if (!pull.ok) return pull;
  return runComposeInRepo(repoRoot, ['up', '-d', '--build', 'asterisk', 'web'], spawnImpl);
}
