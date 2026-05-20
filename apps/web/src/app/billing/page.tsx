import { guardPage } from '@/lib/auth';
import { getBillingRates } from '@/server/page-data';
import { upsertRateAction, deleteRateAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';
export const dynamic = 'force-dynamic';
export default async function BillingPage() {
  await guardPage('supervisor');
  const rates = getBillingRates();
  return (
    <div className="space-y-6"><h2 className="text-lg font-semibold">通話料金</h2>
    <section className="rounded-lg border bg-white p-4"><form action={upsertRateAction} className="flex gap-2">
      <input name="prefix" placeholder="03" className="rounded border px-2 py-1 font-mono" required />
      <input name="perMin" type="number" placeholder="単価/分" className="rounded border px-2 py-1 w-24" required />
      <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white">追加</button></form></section>
    <table className="w-full rounded border bg-white text-sm"><thead><tr className="text-slate-500"><th>prefix</th><th>単価/分</th><th></th></tr></thead>
    <tbody>{rates.map((r) => (<tr key={r.prefix} className="border-t"><td className="font-mono">{r.prefix}</td><td>{r.per_min}</td>
    <td><form action={deleteRateAction}><input type="hidden" name="prefix" value={r.prefix} /><ConfirmButton confirmText="削除？" className="text-red-600 text-xs">削除</ConfirmButton></form></td></tr>))}</tbody></table></div>
  );
}
