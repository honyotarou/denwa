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
      <header>
        <h2 className="text-lg font-semibold">課金明細</h2>
        <p className="text-xs text-slate-500">
          発信先 prefix ごとのレートを設定し、CDR と組み合わせて通話コストを算出。直近 1000 件まで。
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">レート表 ({rates.length})</h3>
        <form
          action={upsertRateAction}
          className="mb-3 grid grid-cols-[100px_1fr_120px_120px_auto] gap-2"
        >
          <input
            name="prefix"
            required
            placeholder="prefix"
            className="rounded border border-slate-300 px-2 py-1 font-mono text-sm"
          />
          <input
            name="label"
            placeholder="メモ (例: 国内固定)"
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            name="perMin"
            type="number"
            step="0.01"
            min={0}
            placeholder="円/分"
            required
            className="rounded border border-slate-300 px-2 py-1 font-mono text-sm"
          />
          <input
            name="setupFee"
            type="number"
            step="0.01"
            min={0}
            placeholder="接続料"
            className="rounded border border-slate-300 px-2 py-1 font-mono text-sm"
          />
          <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
            追加/更新
          </button>
        </form>
        {rates.length === 0 ? (
          <p className="text-sm text-slate-500">未登録。</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {rates.map((r) => (
              <li key={r.prefix} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-20 font-mono">{r.prefix}</span>
                <span className="flex-1">{r.label ?? '—'}</span>
                <span className="font-mono">¥{r.perMin.toFixed(2)}/分</span>
                <span className="font-mono">+¥{r.setupFee.toFixed(2)}</span>
                <form action={deleteRateAction}>
                  <input type="hidden" name="prefix" value={r.prefix} />
                  <ConfirmButton
                    confirmText={`レート ${r.prefix} を削除しますか？`}
                    className="rounded border border-red-300 bg-white px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
                  >
                    削除
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-slate-700">CDR 明細（最大 1000 件）</h3>
          <p className="text-sm tabular-nums">
            合計: <span className="font-bold">¥{total.toFixed(2)}</span>
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
                    <td className="tabular-nums">{r.cost > 0 ? `¥${r.cost.toFixed(2)}` : '—'}</td>
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
