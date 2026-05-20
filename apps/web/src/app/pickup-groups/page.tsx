import { guardPage } from '@/lib/auth';
import { listPickupGroups, getExtensions } from '@/server/page-data';
import { createPickupGroupAction, updatePickupGroupAction, deletePickupGroupAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';
export const dynamic = 'force-dynamic';
export default async function PickupGroupsPage() {
  await guardPage('user');
  const items = listPickupGroups();
  const def = getExtensions().map((e) => e.number).join(',');
  return (
    <div className="space-y-6"><h2 className="text-lg font-semibold">ピックアップグループ</h2>
    <section className="rounded-lg border border-slate-200 bg-white p-4"><form action={createPickupGroupAction} className="flex flex-wrap gap-2 items-end">
      <label className="text-xs">名前<input name="name" required className="mt-1 block rounded border px-2 py-1" /></label>
      <label className="text-xs">メンバー<input name="members" defaultValue={def} className="mt-1 block rounded border px-2 py-1 font-mono" /></label>
      <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">追加</button></form></section>
    <section className="rounded-lg border border-slate-200 bg-white p-4"><ul className="divide-y text-sm">{items.map((g) => (
      <li key={g.name} className="py-3"><div className="font-semibold">{g.name}</div>
      <div className="text-slate-500">{g.members.map((m)=>m.number).join(', ')}</div>
      <form action={deletePickupGroupAction} className="mt-2"><input type="hidden" name="name" value={g.name} />
      <ConfirmButton confirmText="削除しますか？" className="rounded bg-red-600 px-2 py-1 text-sm text-white">削除</ConfirmButton></form></li>
    ))}</ul></section></div>);}