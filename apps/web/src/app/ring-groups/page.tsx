import { guardPage } from '@/lib/auth';
import { listRingGroups, getExtensions } from '@/server/page-data';
import { createRingGroupAction, updateRingGroupAction, deleteRingGroupAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';

export const dynamic = 'force-dynamic';

export default async function RingGroupsPage() {
  await guardPage('user');
  const items = listRingGroups();
  const extNums = getExtensions().map((e) => e.number).join(',');
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">着信グループ</h2>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">新規追加</h3>
        <form action={createRingGroupAction} className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-600">
            番号
            <input name="number" required className="mt-1 w-full rounded border px-2 py-1" placeholder="6000" />
          </label>
          <label className="text-xs text-slate-600">
            名前
            <input name="name" className="mt-1 w-full rounded border px-2 py-1" />
          </label>
          <label className="text-xs text-slate-600">
            戦略
            <select name="strategy" className="mt-1 w-full rounded border px-2 py-1">
              <option value="ringall">ringall</option>
              <option value="linear">linear</option>
            </select>
          </label>
          <label className="text-xs text-slate-600">
            呼出秒
            <input name="ringSeconds" type="number" defaultValue={30} className="mt-1 w-full rounded border px-2 py-1" />
          </label>
          <label className="text-xs text-slate-600 sm:col-span-2">
            フォールバック内線 (無応答時)
            <input
              name="fallbackExtension"
              placeholder="例: 1001"
              className="mt-1 w-full rounded border px-2 py-1 font-mono text-sm"
            />
          </label>
          <label className="text-xs text-slate-600 sm:col-span-2">
            メンバー (カンマ区切り)
            <input name="members" defaultValue={extNums} className="mt-1 w-full rounded border px-2 py-1 font-mono text-sm" />
          </label>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            追加
          </button>
        </form>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">登録済み ({items.length})</h3>
        <ul className="divide-y text-sm">
          {items.map((g) => (
            <li key={g.number} className="space-y-2 py-3">
              <div className="font-mono">
                {g.number} {g.name} — {g.strategy} {g.ringSeconds}s
                {g.fallbackExtension ? (
                  <span className="ml-2 text-slate-500">fallback: {g.fallbackExtension}</span>
                ) : null}
              </div>
              <div className="text-slate-500">
                メンバー: {g.members.map((m) => m.number).join(', ') || '—'}
              </div>
              <form action={updateRingGroupAction} className="grid gap-2 sm:grid-cols-2">
                <input type="hidden" name="number" value={g.number} />
                <label className="text-xs">
                  名前
                  <input name="name" defaultValue={g.name ?? ''} className="mt-1 w-full rounded border px-2 py-1" />
                </label>
                <label className="text-xs">
                  戦略
                  <select name="strategy" defaultValue={g.strategy} className="mt-1 w-full rounded border px-2 py-1">
                    <option value="ringall">ringall</option>
                    <option value="linear">linear</option>
                  </select>
                </label>
                <label className="text-xs">
                  呼出秒
                  <input
                    name="ringSeconds"
                    type="number"
                    defaultValue={g.ringSeconds}
                    className="mt-1 w-full rounded border px-2 py-1"
                  />
                </label>
                <label className="text-xs">
                  フォールバック内線
                  <input
                    name="fallbackExtension"
                    defaultValue={g.fallbackExtension ?? ''}
                    className="mt-1 w-full rounded border px-2 py-1 font-mono"
                  />
                </label>
                <label className="text-xs sm:col-span-2">
                  メンバー
                  <input
                    name="members"
                    defaultValue={g.members.map((m) => m.number).join(',')}
                    className="mt-1 w-full rounded border px-2 py-1 font-mono"
                  />
                </label>
                <button type="submit" className="rounded border px-2 py-1 text-sm sm:col-span-2">
                  保存
                </button>
              </form>
              <form action={deleteRingGroupAction}>
                <input type="hidden" name="number" value={g.number} />
                <ConfirmButton
                  confirmText={`着信グループ ${g.number} を削除しますか？`}
                  className="rounded bg-red-600 px-2 py-1 text-sm text-white"
                >
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
