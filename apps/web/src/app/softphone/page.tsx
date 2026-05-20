import { headers } from 'next/headers';
import { guardPage, getCurrentAccount, getRequestContext } from '@/lib/auth';
import { getSoftphoneProfiles } from '@/server/services/softphone';
import { SoftphonePanel } from './softphone-panel';

export const dynamic = 'force-dynamic';

export default async function SoftphonePage() {
  await guardPage('user');
  const me = await getCurrentAccount();
  const ctx = await getRequestContext();
  const profiles = me ? getSoftphoneProfiles(ctx, me) : [];
  const h = await headers();
  const host = h.get('host')?.split(':')[0] ?? 'localhost';

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">ブラウザソフトフォン (WebRTC)</h2>
        <p className="text-xs text-slate-500">
          admin は全 WebRTC 内線。user/supervisor は /accounts の内線割当のみ（T-SOFT-002/003）。
        </p>
      </header>
      <SoftphonePanel profiles={profiles} defaultHost={host} />
      <p className="text-xs text-slate-500">
        dev: <code className="rounded bg-slate-100 px-1">./scripts/gen-dev-asterisk-certs.sh</code> のあと{' '}
        <code className="rounded bg-slate-100 px-1">docker compose -f docker-compose.yml -f docker-compose.softphone-dev.yml up -d asterisk</code>
        （詳細は <code className="rounded bg-slate-100 px-1">asterisk/certs/README.md</code>）。
      </p>
    </div>
  );
}
