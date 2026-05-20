import { guardPage } from '@/lib/auth';
import { listPhonebook } from '@/server/page-data';
import { createPhonebookAction, deletePhonebookAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';
export const dynamic = 'force-dynamic';
export default async function PhonebookPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await guardPage('user');
  const q = (await searchParams).q ?? '';
  const items = listPhonebook(q);
  return (<div className="space-y-6"><h2 className="text-lg font-semibold">電話帳</h2>
  <form method="get" className="flex gap-2"><input name="q" defaultValue={q} className="rounded border px-2 py-1 text-sm" placeholder="検索" /><button className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">検索</button></form>
  <section className="rounded-lg border border-slate-200 bg-white p-4"><form action={createPhonebookAction} className="flex flex-wrap gap-2"><input name="name" placeholder="名前" required className="rounded border px-2 py-1" />
  <input name="number" placeholder="番号" required className="rounded border px-2 py-1 font-mono" /><button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">追加</button></form></section>
  <section className="rounded-lg border border-slate-200 bg-white p-4"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500"><th>名前</th><th>番号</th><th></th></tr></thead><tbody>
  {items.map((r) => (<tr key={r.id} className="border-t"><td>{r.name}</td><td className="font-mono">{r.number}</td><td>
  <form action={deletePhonebookAction}><input type="hidden" name="id" value={r.id} /><ConfirmButton confirmText="削除？" className="text-red-600 text-xs">削除</ConfirmButton></form></td></tr>))}
  </tbody></table></section></div>);}