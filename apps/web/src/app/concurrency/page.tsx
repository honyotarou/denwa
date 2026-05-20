import { guardPage } from '@/lib/auth';
import { listConcurrency } from '@/server/page-data';
import { formatJst } from '@/lib/datetime';
export const dynamic = 'force-dynamic';
export default async function ConcurrencyPage() {
  await guardPage('user');
  const rows = listConcurrency();
  const max = rows.reduce((m, r) => Math.max(m, r.channels), 0);
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">同時通話</h2>
      <p className="text-sm text-slate-600">直近最大: <span className="font-bold tabular-nums">{max}</span></p>
      <table className="w-full rounded border bg-white text-sm"><thead><tr className="text-slate-500"><th>時刻</th><th>同時</th></tr></thead>
      <tbody>{rows.map((r) => (<tr key={r.minuteAt} className="border-t"><td>{formatJst(r.minuteAt)}</td><td className="tabular-nums">{r.channels}</td></tr>))}</tbody></table>
    </div>
  );
}
