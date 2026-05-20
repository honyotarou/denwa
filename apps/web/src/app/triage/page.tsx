import Link from 'next/link';
import { guardPage } from '@/lib/auth';
import { getPatientForUi } from '@/server/page-data';
import { TriageFlow } from './triage-flow';

export const dynamic = 'force-dynamic';

export default async function TriagePage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string; ext?: string }>;
}) {
  await guardPage('user');
  const sp = await searchParams;
  const patientId = sp.patient?.trim();
  const patient = patientId ? getPatientForUi(patientId) : null;

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">問診フロー（受付補助）</h2>
        <p className="text-xs text-slate-500">
          電話受付時の聞き取りメモ用です。診断の確定や治療方針の決定には使いません。
        </p>
        {patientId && (
          <p className="mt-1 text-sm">
            患者:{' '}
            {patient ? (
              <Link href={`/patients/${patient.id}`} className="font-mono text-blue-600 hover:underline">
                {patient.id} {patient.name ?? ''}
              </Link>
            ) : (
              <span className="text-amber-700">未登録の患者番号です。保存時に自動作成されます。</span>
            )}
          </p>
        )}
        {!patientId && (
          <p className="mt-1 text-sm text-amber-700">
            保存するには URL に <code className="rounded bg-slate-100 px-1">?patient=12345</code> を付けてください。
          </p>
        )}
      </header>
      <TriageFlow patientId={patientId} extension={sp.ext} />
    </div>
  );
}
