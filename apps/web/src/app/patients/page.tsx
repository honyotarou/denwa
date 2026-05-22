import Link from 'next/link';
import { guardPage } from '@/lib/auth';
import { listPatientsForUi, listRecentPatientRecordsForUi } from '@/server/page-data';
import { upsertPatientAction } from '@/app/actions';
import { PageHeader } from '@/components/PageHeader';
import { PageSection } from '@/components/PageSection';

export const dynamic = 'force-dynamic';

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await guardPage('user');
  const sp = await searchParams;
  const patients = listPatientsForUi(sp.q);
  const recent = listRecentPatientRecordsForUi(30, 14);

  return (
    <div className="space-y-6">
      <PageHeader
        title="患者 / 記録"
        description="問診サマリの保存先。診断確定ツールではありません。"
      />

      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={sp.q ?? ''}
          placeholder="患者番号 / 名前 / ふりがな"
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
        />
        <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700">
          検索
        </button>
      </form>

      <PageSection title="新規 / 更新">
        <form action={upsertPatientAction} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input name="id" required pattern="\d{5}" maxLength={5} placeholder="患者番号 5桁" className="rounded border border-slate-300 px-2 py-1 font-mono text-sm" />
          <input name="name" placeholder="氏名" className="rounded border border-slate-300 px-2 py-1 text-sm" />
          <input name="kana" placeholder="ふりがな" className="rounded border border-slate-300 px-2 py-1 text-sm" />
          <input name="birthDate" type="date" className="rounded border border-slate-300 px-2 py-1 text-sm" />
          <input name="phone" placeholder="連絡先" className="rounded border border-slate-300 px-2 py-1 font-mono text-sm" />
          <input name="note" placeholder="備考" className="rounded border border-slate-300 px-2 py-1 text-sm sm:col-span-2" />
          <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 sm:col-span-2">
            保存
          </button>
        </form>
      </PageSection>

      <PageSection title="最近の記録（14 日以内・最大 30 件）">
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">記録がありません。</p>
        ) : (
          <ul className="divide-y divide-slate-200 text-sm">
            {recent.map((r) => (
              <li key={r.id} className="py-2">
                <Link href={`/patients/${r.patientId}`} className="font-mono text-blue-600 hover:underline">
                  {r.patientId}
                </Link>
                <span className="ml-2 text-slate-500">{r.kind}</span>
                <span className="ml-2 text-slate-400">{r.recordedAt}</span>
              </li>
            ))}
          </ul>
        )}
      </PageSection>

      <PageSection title={`患者一覧 (${patients.length})`}>
        <ul className="divide-y divide-slate-200 text-sm">
          {patients.map((p) => (
            <li key={p.id} className="flex justify-between py-2">
              <Link href={`/patients/${p.id}`} className="font-mono text-blue-600 hover:underline">
                {p.id}
              </Link>
              <span>{p.name ?? '—'}</span>
            </li>
          ))}
        </ul>
      </PageSection>
    </div>
  );
}
