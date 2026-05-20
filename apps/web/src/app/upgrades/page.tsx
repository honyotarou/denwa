import { requireRole } from '@/lib/auth';
import { getVersionUpgrades } from '@/server/page-data';
import { scheduleUpgradeAction, deleteUpgradeAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';
import { formatJst } from '@/lib/datetime';

export const dynamic = 'force-dynamic';

export default async function UpgradesPage() {
  await requireRole('admin');
  const items = getVersionUpgrades();
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">バージョンアップ予約</h2>
      <section className="rounded-lg border bg-white p-4">
        <form action={scheduleUpgradeAction} className="flex flex-wrap gap-2">
          <input name="asteriskImage" placeholder="v1.2.0" required className="rounded border px-2 py-1" />
          <input
            name="scheduledAt"
            placeholder="2026-06-01T02:00:00Z"
            required
            className="rounded border px-2 py-1 font-mono text-sm"
          />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white">
            予約
          </button>
        </form>
      </section>
      <ul className="divide-y rounded border bg-white text-sm">
        {items.map((u) => (
          <li key={u.id} className="flex justify-between p-3">
            <span>
              {u.asteriskImage} {formatJst(u.scheduledAt)}
            </span>
            <form action={deleteUpgradeAction}>
              <input type="hidden" name="id" value={u.id} />
              <ConfirmButton confirmText="予約を削除しますか？" className="text-red-600 text-xs">
                削除
              </ConfirmButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
