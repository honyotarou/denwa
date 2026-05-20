import { guardPage, requireMinRole } from '@/lib/auth';
import { listCdr } from '@/server/page-data';
import { formatJst } from '@/lib/datetime';
import { formatDurationSeconds } from '@/lib/datetime';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export default async function CdrPage() {
  const me = await guardPage('user');
  const rows = listCdr(100);
  const sup = me.role === 'supervisor' || me.role === 'admin';
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">発着信履歴</h2>
        {sup && <Link href="/api/cdr/ingest" className="text-sm text-blue-600 hover:underline">いま取り込む</Link>}
      </div>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm"><thead><tr className="text-left text-slate-500"><th>開始</th><th>src</th><th>dst</th><th>秒</th><th>結果</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.uniqueid} className="border-t"><td>{formatJst(r.startTime)}</td><td className="font-mono">{r.src}</td>
          <td className="font-mono">{r.dst}</td><td>{formatDurationSeconds(r.billsec)}</td><td>{r.disposition}</td></tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}
