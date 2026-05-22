import { guardPage } from '@/lib/auth';
import { formatJst, formatDurationSeconds } from '@/lib/datetime';
import Link from 'next/link';
import { ingestCdrNowAction } from '@/app/actions';
import { CDR_DISPOSITION_OPTIONS } from '@openpbx/core';
import { CdrDispositionBadge } from '@/components/CdrDispositionBadge';
import { PageHeader } from '@/components/PageHeader';
import { DataTableShell } from '@/components/DataTableShell';
import { listCdrForUiWithFilter } from '@/server/page-data';

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="発着信履歴 (CDR)"
          description="Asterisk の cdr_csv (Master.csv) を取り込み。表示時に最新化、バックグラウンドは 10 秒間隔。"
        />
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

      <form
        method="get"
        className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-6"
      >
        <input
          name="from"
          type="datetime-local"
          defaultValue={sp.from ?? ''}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          aria-label="from"
        />
        <input
          name="to"
          type="datetime-local"
          defaultValue={sp.to ?? ''}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          aria-label="to"
        />
        <input
          name="src"
          defaultValue={sp.src ?? ''}
          placeholder="発信元 (src)"
          className="rounded border border-slate-300 px-2 py-1 font-mono text-sm"
          aria-label="src フィルタ"
        />
        <input
          name="dst"
          defaultValue={sp.dst ?? ''}
          placeholder="宛先 (dst)"
          className="rounded border border-slate-300 px-2 py-1 font-mono text-sm"
          aria-label="dst フィルタ"
        />
        <select
          name="disposition"
          defaultValue={sp.disposition ?? ''}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          aria-label="disposition"
        >
          {CDR_DISPOSITION_OPTIONS.map((v) => (
            <option key={v || 'all'} value={v}>
              {v || '— 全 disposition —'}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          検索
        </button>
      </form>

      <DataTableShell>
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-1 text-left" scope="col">
                開始
              </th>
              <th className="px-2 py-1 text-left" scope="col">
                応答
              </th>
              <th className="px-2 py-1 text-left" scope="col">
                src
              </th>
              <th className="px-2 py-1 text-left" scope="col">
                dst
              </th>
              <th className="px-2 py-1 text-left" scope="col">
                channel
              </th>
              <th className="px-2 py-1 text-left" scope="col">
                秒
              </th>
              <th className="px-2 py-1 text-left" scope="col">
                結果
              </th>
              <th className="px-2 py-1 text-left" scope="col">
                録音
              </th>
              <th className="px-2 py-1 text-left" scope="col">
                Inbox
              </th>
              {sup && (
                <th className="px-2 py-1 text-left" scope="col">
                  prefix
                </th>
              )}
              {sup && (
                <th className="px-2 py-1 text-left" scope="col">
                  概算
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={sup ? 10 : 8} className="p-4 text-center text-slate-500">
                  該当する CDR がありません。
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const full = rawById.get(r.uniqueid);
                return (
                  <tr key={r.uniqueid}>
                    <td className="px-2 py-1 font-mono">{formatJst(r.startTime)}</td>
                    <td className="px-2 py-1 font-mono">
                      {full?.answerTime ? formatJst(full.answerTime) : '—'}
                    </td>
                    <td className="px-2 py-1 font-mono">{r.src}</td>
                    <td className="px-2 py-1 font-mono">{r.dst}</td>
                    <td
                      className="max-w-[8rem] truncate px-2 py-1 font-mono"
                      title={full?.channel ?? ''}
                    >
                      {full?.channel ?? '—'}
                    </td>
                    <td className="px-2 py-1 tabular-nums">{formatDurationSeconds(r.billsec)}</td>
                    <td className="px-2 py-1">
                      <CdrDispositionBadge disposition={r.disposition} />
                    </td>
                    <td className="px-2 py-1 font-mono">
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
                    <td className="px-2 py-1 font-mono">
                      {r.inboxMetaName ? (
                        <Link href="/inbox" className="text-blue-600 hover:underline">
                          {r.inboxMetaName}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    {sup && <td className="px-2 py-1 font-mono">{r.ratePrefix ?? '—'}</td>}
                    {sup && (
                      <td className="px-2 py-1 tabular-nums">
                        {r.cost > 0 ? r.cost.toFixed(2) : '—'}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </DataTableShell>
    </div>
  );
}
