import { requireRole } from '@/lib/auth';
import { listSipTrunks } from '@/server/page-data';
import { upsertTrunkAction, deleteTrunkAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';

export const dynamic = 'force-dynamic';

export default async function TrunksPage() {
  await requireRole('admin');
  const trunks = listSipTrunks();
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">SIP Trunk</h2>
      <section className="rounded-lg border bg-white p-4">
        <form action={upsertTrunkAction} className="flex flex-wrap gap-2">
          <input name="name" placeholder="trunk-a" required className="rounded border px-2 py-1" />
          <input name="host" placeholder="sip.example.com" required className="rounded border px-2 py-1" />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white">
            保存
          </button>
        </form>
      </section>
      <ul className="divide-y rounded border bg-white text-sm">
        {trunks.map((t) => (
          <li key={t.name} className="flex justify-between p-3">
            <span>
              {t.name} — {t.host}
            </span>
            <form action={deleteTrunkAction}>
              <input type="hidden" name="name" value={t.name} />
              <ConfirmButton confirmText="削除しますか？" className="text-red-600 text-xs">
                削除
              </ConfirmButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
