import { guardPage } from '@/lib/auth';
import { listGuidances } from '@/server/page-data';
import { deleteGuidanceAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';
export const dynamic = 'force-dynamic';
export default async function GuidancesPage() {
  await guardPage('user');
  const items = listGuidances();
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">ガイダンス音声</h2>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <form action="/api/guidances" method="post" encType="multipart/form-data" className="flex flex-wrap gap-2">
          <input name="name" placeholder="welcome" required className="rounded border px-2 py-1" />
          <input name="file" type="file" accept=".wav,audio/wav" required className="text-sm" />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">送信</button>
        </form>
      </section>
      <ul className="divide-y rounded border bg-white text-sm">{items.map((g) => (
        <li key={g.name} className="flex justify-between p-3"><span>{g.name}</span>
        <form action={deleteGuidanceAction}><input type="hidden" name="name" value={g.name} />
        <ConfirmButton confirmText="削除？" className="text-red-600 text-xs">削除</ConfirmButton></form></li>
      ))}</ul>
    </div>
  );
}
