import { requireRole } from '@/lib/auth';
import { getUpgradesForUi } from '@/server/page-data';
import { scheduleUpgradeAction, deleteUpgradeAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';
import { formatJst } from '@/lib/datetime';

export const dynamic = 'force-dynamic';

export default async function UpgradesPage() {
  await requireRole('admin');
  const { scheduled, due } = getUpgradesForUi();
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">バージョンアップ予約</h2>
        <p className="text-xs text-slate-500">
          Asterisk / Web イメージの基底タグ切替予定を記録します。実際の docker compose pull / up はホスト側で実行する必要があります。
        </p>
      </header>
      {due.length > 0 && (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <h3 className="font-semibold text-amber-900">実行時期を過ぎた予約 ({due.length})</h3>
          <p className="mt-1 text-amber-800">
            <code className="rounded bg-amber-100 px-1">ALLOW_UPGRADE_EXEC=1</code> と docker.sock があれば Web が自動実行します。
            それ以外は <code className="rounded bg-amber-100 px-1">scripts/upgrade-watcher.sh</code> または以下を手動実行してください。
          </p>
          <ul className="mt-3 space-y-3">
            {due.map((u) => (
              <li key={u.id} className="rounded border border-amber-200 bg-white p-3">
                <div className="font-mono text-xs">
                  #{u.id} {u.asteriskImage}
                  {u.webImage ? ` / ${u.webImage}` : ''} — {formatJst(u.scheduledAt)}
                </div>
                {u.note ? <p className="mt-1 text-xs text-slate-600">{u.note}</p> : null}
                <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-2 text-xs text-slate-100">
                  {u.commands.join('\n')}
                </pre>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">新規予約</h3>
        <form action={scheduleUpgradeAction} className="grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr_1fr_1fr_auto]">
          <label className="text-xs text-slate-600">
            予定日時 (UTC)
            <input
              name="scheduledAt"
              required
              type="datetime-local"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
            />
          </label>
          <label className="text-xs text-slate-600">
            asterisk image
            <input
              name="asteriskImage"
              required
              placeholder="例: ubuntu:24.04"
              defaultValue="ubuntu:22.04"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
            />
          </label>
          <label className="text-xs text-slate-600">
            web image
            <input
              name="webImage"
              placeholder="例: node:22-bookworm-slim"
              defaultValue="node:20-bookworm-slim"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
            />
          </label>
          <label className="text-xs text-slate-600">
            メモ
            <input name="note" className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <button type="submit" className="self-end rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white">
            予約
          </button>
        </form>
      </section>
      <ul className="divide-y rounded border bg-white text-sm">
        {scheduled.map((u) => (
          <li key={u.id} className="flex justify-between p-3">
            <span>
              {u.asteriskImage}
              {u.webImage ? ` / ${u.webImage}` : ''} {formatJst(u.scheduledAt)}
              {u.note ? <span className="ml-2 text-slate-500">{u.note}</span> : null}
              {u.appliedAt ? (
                <span className="ml-2 text-emerald-600 text-xs">適用済 {formatJst(u.appliedAt)}</span>
              ) : null}
            </span>
            <form action={deleteUpgradeAction}>
              <input type="hidden" name="id" value={u.id} />
              <ConfirmButton confirmText="予約を削除しますか？" className="text-red-600 text-xs">
                削除
              </ConfirmButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
