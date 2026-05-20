import { requireRole } from '@/lib/auth';
import { getPasswordPolicyForUi, listIpAllowRows } from '@/server/page-data';
import { updatePolicyAction, upsertIpAllowAction, deleteIpAllowAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';

export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  await requireRole('admin');
  const policy = getPasswordPolicyForUi();
  const ips = listIpAllowRows();
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">セキュリティ</h2>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">パスワードポリシー</h3>
        <form action={updatePolicyAction} className="flex flex-wrap items-center gap-3 text-sm">
          <label>
            最小長
            <input name="minLength" type="number" defaultValue={policy.minLength} className="ml-1 w-16 rounded border px-2 py-1" />
          </label>
          <label>
            <input type="checkbox" name="requireDigit" defaultChecked={!!policy.requireDigit} /> 数字必須
          </label>
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">
            保存
          </button>
        </form>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">IP 許可リスト</h3>
        <form action={upsertIpAllowAction} className="mb-3 flex flex-wrap gap-2">
          <input name="cidr" placeholder="10.0.0.0/8" required className="rounded border px-2 py-1 font-mono text-sm" />
          <input name="note" placeholder="備考" className="rounded border px-2 py-1 text-sm" />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">
            追加
          </button>
        </form>
        <ul className="text-sm">
          {ips.map((row) => (
            <li key={row.cidr} className="flex justify-between border-t py-2">
              <span className="font-mono">
                {row.cidr} {row.note}
              </span>
              <form action={deleteIpAllowAction}>
                <input type="hidden" name="cidr" value={row.cidr} />
                <ConfirmButton confirmText="削除しますか？" className="text-xs text-red-600">
                  削除
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
