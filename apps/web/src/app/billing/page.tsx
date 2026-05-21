import { guardPage } from '@/lib/auth';
import { formatJst } from '@/lib/datetime';
import { getBillingRates, getBillingDetailForUi } from '@/server/page-data';
import { upsertRateAction, deleteRateAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  await guardPage('supervisor');
  const rates = getBillingRates();
  const { rows: detail, total } = getBillingDetailForUi();
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">通話料金</h2>
      <section className="rounded-lg border bg-white p-4">
        <form action={upsertRateAction} className="flex gap-2">
          <input name="prefix" placeholder="03" className="rounded border px-2 py-1 font-mono" required />
          <input name="perMin" type="number" placeholder="単価/分" className="rounded border px-2 py-1 w-24" required />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white">
            追加
          </button>
        </form>
      </section>
      <table className="w-full rounded border bg-white text-sm">
        <thead>
          <tr className="text-slate-500">
            <th>prefix</th>
            <th>単価/分</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rates.map((r) => (
            <tr key={r.prefix} className="border-t">
              <td className="font-mono">{r.prefix}</td>
              <td>{r.per_min}</td>
              <td>
                <form action={deleteRateAction}>
                  <input type="hidden" name="prefix" value={r.prefix} />
                  <ConfirmButton confirmText="削除？" className="text-red-600 text-xs">
                    削除
                  </ConfirmButton>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-slate-700">CDR 明細（最大 1000 件）</h3>
          <p className="text-sm tabular-nums">
            合計: <span className="font-bold">{total.toFixed(2)}</span> 円
          </p>
        </div>
        <div className="overflow-x-auto rounded border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th>開始</th>
                <th>src</th>
                <th>dst</th>
                <th>秒</th>
                <th>prefix</th>
                <th>料金</th>
              </tr>
            </thead>
            <tbody>
              {detail.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-slate-500">
                    CDR がありません。/cdr で取り込み後に表示されます。
                  </td>
                </tr>
              ) : (
                detail.map((r) => (
                  <tr key={r.uniqueid} className="border-t">
                    <td>{r.startAt ? formatJst(r.startAt) : '—'}</td>
                    <td className="font-mono">{r.src ?? '—'}</td>
                    <td className="font-mono">{r.dst ?? '—'}</td>
                    <td className="tabular-nums">{r.billsec}</td>
                    <td className="font-mono text-xs">{r.ratePrefix ?? '—'}</td>
                    <td className="tabular-nums">{r.cost > 0 ? r.cost.toFixed(2) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
