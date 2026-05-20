import { guardPage } from '@/lib/auth';
import { listCdrForUi } from '@/server/page-data';
import { formatJst, formatDurationSeconds } from '@/lib/datetime';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CdrPage() {
  const me = await guardPage('user');
  const rows = listCdrForUi(100);
  const sup = me.role === 'supervisor' || me.role === 'admin';
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">発着信履歴</h2>
        {sup && (
          <div className="flex gap-3 text-sm">
            <Link href="/api/cdr/export" className="text-blue-600 hover:underline">CSV ダウンロード</Link>
            <Link href="/api/cdr/ingest" className="text-blue-600 hover:underline">いま取り込む</Link>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500">課金レートは /billing の prefix に従い自動計算（5 分ごとに CSV 取り込み）。</p>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th>開始</th>
              <th>src</th>
              <th>dst</th>
              <th>秒</th>
              <th>結果</th>
              {sup && <th>単価 prefix</th>}
              {sup && <th>概算料金</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.uniqueid} className="border-t">
                <td>{formatJst(r.startTime)}</td>
                <td className="font-mono">{r.src}</td>
                <td className="font-mono">{r.dst}</td>
                <td>{formatDurationSeconds(r.billsec)}</td>
                <td>{r.disposition}</td>
                {sup && <td className="font-mono text-xs">{r.ratePrefix ?? '—'}</td>}
                {sup && <td className="tabular-nums">{r.cost > 0 ? r.cost.toFixed(2) : '—'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
