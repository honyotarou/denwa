import { headers } from 'next/headers';
import { guardPage, getCurrentAccount, getRequestContext } from '@/lib/auth';
import { getSoftphoneProfiles } from '@/server/services/softphone';
import { SoftphonePanel } from './softphone-panel';
import { TriageFlow } from '../triage/triage-flow';

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
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">ブラウザソフトフォン (WebRTC)</h2>
        <p className="text-xs text-slate-500">
          admin は全 WebRTC 内線。user/supervisor は /accounts の内線割当のみ。右に問診フロー（OpenPBX 同様 2 カラム）。
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <SoftphonePanel profiles={profiles} defaultHost={host} />
          <p className="text-xs text-slate-500">
            dev: <code className="rounded bg-slate-100 px-1">./scripts/gen-dev-asterisk-certs.sh</code> のあと{' '}
            <code className="rounded bg-slate-100 px-1">docker compose -f docker-compose.yml -f docker-compose.softphone-dev.yml up -d asterisk</code>
          </p>
        </div>
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">問診フロー（受付補助）</h3>
          {!patientId && (
            <p className="mb-2 text-xs text-amber-700">
              記録保存には <code className="rounded bg-slate-100 px-1">?patient=12345</code> を URL に付けてください。
            </p>
          )}
          <TriageFlow patientId={patientId} extension={sp.ext} />
        </section>
      </div>
    </div>
  );
}
