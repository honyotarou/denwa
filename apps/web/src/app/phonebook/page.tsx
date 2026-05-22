import { guardPage } from '@/lib/auth';
import { listPhonebook } from '@/server/page-data';
import { createPhonebookAction, updatePhonebookAction, deletePhonebookAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';
import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function PhonebookPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await guardPage('user');
  const q = (await searchParams).q ?? '';
  const items = listPhonebook(q);
  return (
    <div className="space-y-6">
      <PageHeader title="共通電話帳" description="内線・外線の短縮ダイヤル用エントリ。" />
      <form method="get" className="flex gap-2">
        <input name="q" defaultValue={q} className="rounded border px-2 py-1 text-sm" placeholder="検索" />
        <button className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          検索
        </button>
      </form>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">新規追加</h3>
        <form action={createPhonebookAction} className="grid gap-2 sm:grid-cols-2">
          <input name="name" placeholder="名前" required className="rounded border px-2 py-1" />
          <input name="number" placeholder="番号" required className="rounded border px-2 py-1 font-mono" />
          <input name="category" placeholder="カテゴリ" className="rounded border px-2 py-1" />
          <input name="note" placeholder="メモ" className="rounded border px-2 py-1" />
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 sm:col-span-2"
          >
            追加
          </button>
        </form>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-2">名前</th>
              <th>番号</th>
              <th>カテゴリ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="py-2">
                  <form action={updatePhonebookAction} className="space-y-1">
                    <input type="hidden" name="id" value={r.id} />
                    <input name="name" defaultValue={r.name} required className="w-full rounded border px-2 py-1" />
                    <input name="note" defaultValue={r.note ?? ''} placeholder="メモ" className="w-full rounded border px-2 py-1 text-xs" />
                    <input name="number" defaultValue={r.number} required className="w-full rounded border px-2 py-1 font-mono text-xs" />
                    <input name="category" defaultValue={r.category ?? ''} placeholder="カテゴリ" className="w-full rounded border px-2 py-1 text-xs" />
                    <button type="submit" className="rounded border px-2 py-0.5 text-xs">
                      保存
                    </button>
                  </form>
                </td>
                <td className="py-2 font-mono">{r.number}</td>
                <td className="py-2">{r.category ?? '—'}</td>
                <td className="py-2">
                  <form action={deletePhonebookAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <ConfirmButton confirmText="削除？" className="text-red-600 text-xs">
                      削除
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
