import { guardPage } from '@/lib/auth';
import { listIvrMenus } from '@/server/page-data';
import { upsertIvrAction, deleteIvrAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';
export const dynamic = 'force-dynamic';
export default async function IvrPage() {
  await guardPage('user');
  const menus = listIvrMenus();
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">IVR メニュー</h2>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <form action={upsertIvrAction} className="flex flex-wrap gap-2">
          <input name="number" placeholder="8001" required className="rounded border px-2 py-1 font-mono" />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">保存</button>
        </form>
      </section>
      <ul className="text-sm divide-y rounded border bg-white">
        {menus.map((m) => (
          <li key={m.number} className="flex justify-between p-3">
            <span className="font-mono">{m.number}</span>
            <form action={deleteIvrAction}><input type="hidden" name="number" value={m.number} />
            <ConfirmButton confirmText="IVR を削除？" className="text-red-600 text-xs">削除</ConfirmButton></form>
          </li>
        ))}
      </ul>
    </div>
  );
}
