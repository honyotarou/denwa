import { guardPage } from '@/lib/auth';
import { formatJst } from '@/lib/datetime';
import { getBillingRates, getBillingDetailForUi } from '@/server/page-data';
import { upsertRateAction, deleteRateAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';
import { PageHeader } from '@/components/PageHeader';
import { PageSection } from '@/components/PageSection';
import { DataTableShell } from '@/components/DataTableShell';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  await guardPage('supervisor');
  const rates = getBillingRates();
  const { rows: detail, total } = getBillingDetailForUi();
  return (
    <div className="space-y-6">
      <PageHeader
        title="課金明細"
        description="発信先 prefix ごとのレートを設定し、CDR と組み合わせて通話コストを算出。直近 1000 件まで。"
      />

      <PageSection title={`レート表 (${rates.length})`}>
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
          <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700">
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
      </PageSection>

      <PageSection
        title={
          <span className="flex w-full items-baseline justify-between">
            <span>CDR 明細（最大 1000 件）</span>
            <span className="text-sm font-normal tabular-nums text-slate-600">
              合計: <span className="font-bold text-slate-900">¥{total.toFixed(2)}</span>
            </span>
          </span>
        }
      >
        <DataTableShell>
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-2 py-1 text-left" scope="col">開始</th>
                <th className="px-2 py-1 text-left" scope="col">src</th>
                <th className="px-2 py-1 text-left" scope="col">dst</th>
                <th className="px-2 py-1 text-left" scope="col">秒</th>
                <th className="px-2 py-1 text-left" scope="col">prefix</th>
                <th className="px-2 py-1 text-left" scope="col">料金</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {detail.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-slate-500">
                    CDR がありません。/cdr で取り込み後に表示されます。
                  </td>
                </tr>
              ) : (
                detail.map((r) => (
                  <tr key={r.uniqueid}>
                    <td className="px-2 py-1">{r.startAt ? formatJst(r.startAt) : '—'}</td>
                    <td className="px-2 py-1 font-mono">{r.src ?? '—'}</td>
                    <td className="px-2 py-1 font-mono">{r.dst ?? '—'}</td>
                    <td className="px-2 py-1 tabular-nums">{r.billsec}</td>
                    <td className="px-2 py-1 font-mono">{r.ratePrefix ?? '—'}</td>
                    <td className="px-2 py-1 tabular-nums">{r.cost > 0 ? `¥${r.cost.toFixed(2)}` : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableShell>
      </PageSection>
    </div>
  );
}
