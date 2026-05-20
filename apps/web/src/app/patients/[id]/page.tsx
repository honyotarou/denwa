import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentAccount, guardPage } from '@/lib/auth';
import { getPatientForUi, listPatientRecordsForUi } from '@/server/page-data';
import {
  deletePatientAction,
  deletePatientRecordAction,
  savePatientRecordAction,
  upsertPatientAction,
} from '@/app/actions';
import { ConfirmButton } from '@/components/ConfirmButton';

export const dynamic = 'force-dynamic';

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await guardPage('user');
  const me = await getCurrentAccount();
  const { id } = await params;
  const patient = getPatientForUi(id);
  if (!patient) notFound();
  const records = listPatientRecordsForUi(id);
  const canDelete = me?.role === 'admin' || me?.role === 'supervisor';

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Link href="/patients" className="text-sm text-blue-600 hover:underline">
          ← 一覧
        </Link>
        <h2 className="text-lg font-semibold">患者 {patient.id}</h2>
        <Link href={`/triage?patient=${patient.id}`} className="ml-auto text-sm text-blue-600 hover:underline">
          問診フロー
        </Link>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <form action={upsertPatientAction} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input type="hidden" name="id" value={patient.id} />
          <input name="name" defaultValue={patient.name ?? ''} placeholder="氏名" className="rounded border px-2 py-1 text-sm" />
          <input name="kana" defaultValue={patient.kana ?? ''} placeholder="ふりがな" className="rounded border px-2 py-1 text-sm" />
          <input name="birthDate" type="date" defaultValue={patient.birthDate ?? ''} className="rounded border px-2 py-1 text-sm" />
          <input name="phone" defaultValue={patient.phone ?? ''} placeholder="連絡先" className="rounded border px-2 py-1 text-sm" />
          <input name="note" defaultValue={patient.note ?? ''} placeholder="備考" className="rounded border px-2 py-1 text-sm sm:col-span-2" />
          <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
            更新
          </button>
        </form>
        {canDelete && (
          <form action={deletePatientAction} className="mt-3">
            <input type="hidden" name="id" value={patient.id} />
            <ConfirmButton confirmText="患者と全記録を削除しますか？" className="text-xs text-red-600">
              患者を削除
            </ConfirmButton>
          </form>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">記録を追加</h3>
        <form action={savePatientRecordAction} className="space-y-2">
          <input type="hidden" name="patientId" value={patient.id} />
          <select name="kind" className="rounded border px-2 py-1 text-sm">
            <option value="note">メモ</option>
            <option value="call">通話</option>
            <option value="triage">問診</option>
          </select>
          <textarea name="summary" rows={4} placeholder="サマリ" className="w-full rounded border px-2 py-1 text-sm" />
          <input name="extension" placeholder="内線 (任意)" className="w-full rounded border px-2 py-1 font-mono text-sm" />
          <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
            記録を保存
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">記録 ({records.length})</h3>
        <ul className="space-y-3 text-sm">
          {records.map((r) => (
            <li key={r.id} className="rounded border border-slate-100 p-3">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{r.kind}</span>
                <span>{r.recordedAt}</span>
              </div>
              {r.summary && <pre className="mt-2 whitespace-pre-wrap text-xs">{r.summary}</pre>}
              {canDelete && (
                <form action={deletePatientRecordAction} className="mt-2">
                  <input type="hidden" name="patientId" value={patient.id} />
                  <input type="hidden" name="recordId" value={String(r.id)} />
                  <ConfirmButton confirmText="この記録を削除しますか？" className="text-xs text-red-600">
                    削除
                  </ConfirmButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
