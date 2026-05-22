import { guardPage } from '@/lib/auth';
import { listGuidances } from '@/server/page-data';
import { deleteGuidanceAction } from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';
import { PageHeader } from '@/components/PageHeader';
import { PageSection } from '@/components/PageSection';

export const dynamic = 'force-dynamic';

export default async function GuidancesPage() {
  await guardPage('user');
  const items = listGuidances();
  return (
    <div className="space-y-6">
      <PageHeader title="共通ガイダンス" description="IVR 等で使う wav をアップロード・管理します。" />
      <PageSection title="アップロード">
        <form
          action="/api/guidances"
          method="post"
          encType="multipart/form-data"
          className="flex flex-wrap items-end gap-2"
        >
          <label className="text-xs text-slate-600">
            名前
            <input name="name" placeholder="welcome" required className="mt-1 block rounded border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <label className="text-xs text-slate-600">
            wav
            <input name="file" type="file" accept=".wav,audio/wav" required className="mt-1 block text-sm" />
          </label>
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            送信
          </button>
        </form>
      </PageSection>
      <PageSection title={`登録済み (${items.length})`}>
        <ul className="divide-y divide-slate-200 text-sm">
          {items.map((g) => (
            <li key={g.name} className="flex items-center justify-between py-2">
              <span className="font-mono">{g.name}</span>
              <form action={deleteGuidanceAction}>
                <input type="hidden" name="name" value={g.name} />
                <ConfirmButton confirmText="削除？" className="text-xs text-red-600">
                  削除
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      </PageSection>
    </div>
  );
}
