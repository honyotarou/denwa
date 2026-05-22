import { headers } from 'next/headers';
import { guardPage, getCurrentAccount, getRequestContext } from '@/lib/auth';
import { getSoftphoneProfiles } from '@/server/services/softphone';
import { SoftphonePanel } from './softphone-panel';
import { TriageFlow } from '../triage/triage-flow';
import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function SoftphonePage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string; ext?: string }>;
}) {
  await guardPage('user');
  const me = await getCurrentAccount();
  const ctx = await getRequestContext();
  const profiles = me ? getSoftphoneProfiles(ctx, me) : [];
  const h = await headers();
  const host = h.get('host')?.split(':')[0] ?? 'localhost';
  const sp = await searchParams;
  const patientId = sp.patient?.trim();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
      <section className="min-w-0 space-y-4">
        <PageHeader
          title="ブラウザソフトフォン (WebRTC)"
          description="/extensions で WebRTC を有効化した内線をブラウザから登録して使えます。通話中は右側に問診フローが出るので、聞きながら入力できます。"
        />
        <SoftphonePanel profiles={profiles} defaultHost={host} />
      </section>
      <section className="min-w-0 space-y-4">
        <div className="rounded-lg border-2 border-blue-200 bg-white p-3">
          {!patientId && (
            <p className="mb-2 text-xs text-amber-700">
              記録保存には{' '}
              <code className="rounded bg-slate-100 px-1">?patient=12345</code> を URL に付けてください。
            </p>
          )}
          <TriageFlow
            patientId={patientId}
            extension={sp.ext}
            showHeading={false}
            layout="narrow"
          />
        </div>
      </section>
    </div>
  );
}
