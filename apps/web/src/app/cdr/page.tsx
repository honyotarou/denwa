import { guardPage } from '@/lib/auth';
import { listCdrForUiWithFilter } from '@/server/page-data';
import { formatJst, formatDurationSeconds } from '@/lib/datetime';
import Link from 'next/link';
import { ingestCdrNowAction } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function CdrPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; src?: string; dst?: string; disposition?: string }>;
}) {
  const me = await guardPage('user');
  const sp = await searchParams;
  const { rows, raw } = await listCdrForUiWithFilter(sp);
  const rawById = new Map(raw.map((r) => [r.uniqueid, r]));
  const sup = me.role === 'supervisor' || me.role === 'admin';
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">発着信履歴</h2>
        {sup && (
          <div className="flex gap-3 text-sm">
            <Link href="/api/cdr/export" className="text-blue-600 hover:underline">
              CSV ダウンロード
            </Link>
            <form action={ingestCdrNowAction}>
              <button type="submit" className="text-blue-600 hover:underline">
                いま取り込む
              </button>
            </form>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500">
        表示時に Master.csv を取り込みます。バックグラウンドは 10 秒間隔（CDR_POLL_INTERVAL_MS で変更可）。
      </p>
      <form method="get" className="grid grid-cols-2 gap-2 rounded border bg-white p-3 text-sm sm:grid-cols-5">
        <input name="from" type="datetime-local" defaultValue={sp.from ?? ''} placeholder="from" className="rounded border px-2 py-1" />
        <input name="to" type="datetime-local" defaultValue={sp.to ?? ''} placeholder="to" className="rounded border px-2 py-1" />
        <input name="src" defaultValue={sp.src ?? ''} placeholder="src" className="rounded border px-2 py-1 font-mono" />
        <input name="dst" defaultValue={sp.dst ?? ''} placeholder="dst" className="rounded border px-2 py-1 font-mono" />
        <input name="disposition" defaultValue={sp.disposition ?? ''} placeholder="disposition" className="rounded border px-2 py-1" />
        <button type="submit" className="col-span-2 rounded bg-slate-700 px-3 py-1 text-xs font-semibold text-white sm:col-span-1">
          検索
        </button>
      </form>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th>開始</th>
              <th>応答</th>
              <th>src</th>
              <th>dst</th>
              <th>channel</th>
              <th>秒</th>
              <th>結果</th>
              <th>録音</th>
              <th>Inbox</th>
              {sup && <th>prefix</th>}
              {sup && <th>概算</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={sup ? 10 : 8} className="p-4 text-slate-500">
                  該当する CDR がありません。
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const full = rawById.get(r.uniqueid);
                return (
                  <tr key={r.uniqueid} className="border-t">
                    <td>{formatJst(r.startTime)}</td>
                    <td>{full?.answerTime ? formatJst(full.answerTime) : '—'}</td>
                    <td className="font-mono">{r.src}</td>
                    <td className="font-mono">{r.dst}</td>
                    <td className="max-w-[8rem] truncate font-mono text-xs" title={full?.channel ?? ''}>
                      {full?.channel ?? '—'}
                    </td>
                    <td>{formatDurationSeconds(r.billsec)}</td>
                    <td>{r.disposition}</td>
                    <td className="font-mono text-xs">
                      {r.recordingFile ? (
                        <Link
                          href={`/api/recordings/${encodeURIComponent(r.recordingFile)}`}
                          className="text-blue-600 hover:underline"
                        >
                          {r.recordingFile}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="font-mono text-xs">
                      {r.inboxMetaName ? (
                        <Link href="/inbox" className="text-blue-600 hover:underline">
                          {r.inboxMetaName}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    {sup && <td className="font-mono text-xs">{r.ratePrefix ?? '—'}</td>}
                    {sup && <td className="tabular-nums">{r.cost > 0 ? r.cost.toFixed(2) : '—'}</td>}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
