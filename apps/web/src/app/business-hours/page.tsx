import { guardPage } from '@/lib/auth';
import { getHolidays, listTimeRules } from '@/server/page-data';
import {
  upsertHolidayAction,
  deleteHolidayAction,
  createTimeRuleAction,
  updateTimeRuleAction,
  deleteTimeRuleAction,
} from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';

export const dynamic = 'force-dynamic';

export default async function BusinessHoursPage() {
  await guardPage('user');
  const holidays = getHolidays();
  const rules = listTimeRules();
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">営業時間</h2>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">祝日</h3>
        <form action={upsertHolidayAction} className="mb-3 flex flex-wrap gap-2">
          <input name="date" type="date" required className="rounded border px-2 py-1 text-sm" />
          <input name="name" placeholder="名称" required className="rounded border px-2 py-1 text-sm" />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">
            登録
          </button>
        </form>
        <ul className="text-sm">
          {holidays.map((h) => (
            <li key={h.date} className="flex items-center justify-between border-t py-2">
              <span>
                {h.date} {h.name}
              </span>
              <form action={deleteHolidayAction}>
                <input type="hidden" name="date" value={h.date} />
                <ConfirmButton confirmText="祝日を削除しますか？" className="text-xs text-red-600">
                  削除
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">時間帯ルール</h3>
        <form action={createTimeRuleAction} className="mb-3 grid gap-2 sm:grid-cols-2">
          <input name="name" placeholder="名前" required className="rounded border px-2 py-1 text-sm" />
          <input name="days" defaultValue="mon-fri" className="rounded border px-2 py-1 text-sm" />
          <input name="startTime" defaultValue="09:00" className="rounded border px-2 py-1 text-sm" />
          <input name="endTime" defaultValue="18:00" className="rounded border px-2 py-1 text-sm" />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white sm:col-span-2">
            追加
          </button>
        </form>
        <ul className="text-sm">
          {rules.map((r) => (
            <li key={r.id} className="border-t py-3 space-y-2">
              <form action={updateTimeRuleAction} className="grid gap-2 sm:grid-cols-2">
                <input type="hidden" name="id" value={r.id} />
                <input name="name" defaultValue={r.name} required className="rounded border px-2 py-1 text-sm" />
                <input name="days" defaultValue={r.days} className="rounded border px-2 py-1 text-sm" />
                <input name="startTime" defaultValue={r.startTime} className="rounded border px-2 py-1 text-sm" />
                <input name="endTime" defaultValue={r.endTime} className="rounded border px-2 py-1 text-sm" />
                <button type="submit" className="rounded border px-2 py-1 text-sm sm:col-span-2">
                  保存
                </button>
              </form>
              <form action={deleteTimeRuleAction}>
                <input type="hidden" name="id" value={r.id} />
                <ConfirmButton confirmText="ルールを削除しますか？" className="text-xs text-red-600">
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
