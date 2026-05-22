import Link from 'next/link';
import { canStreamDevices } from '@openpbx/core';
import { guardPage } from '@/lib/auth';
import { formatJst } from '@/lib/datetime';
import { getHomeSummary } from '@/server/page-data';
import { PageHeader } from '@/components/PageHeader';
import { PageSection } from '@/components/PageSection';
import { StatCard } from '@/components/StatCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const me = await guardPage('user');
  const { extensionCount, extensions, inbox, deviceSummary, extensionsMtime } = await getHomeSummary();
  const showDevices = canStreamDevices(me.role);
  const onlineLabel = showDevices
    ? !deviceSummary.amiReady || deviceSummary.online === null
      ? '—'
      : `${deviceSummary.online} / ${deviceSummary.total ?? 0}`
    : '—';
  const mtimeHint = extensionsMtime ? `PJSIP 更新 ${formatJst(extensionsMtime)}` : 'extensions.conf 未取得';
  return (
    <div className="space-y-6">
      <PageHeader
        title="PBX 概要"
        description="Asterisk ベース PBX の状態と設定への入り口。文字起こし・要約などの AI 処理は別システムが data/inbox/ を監視して処理します。"
      />
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="サマリー">
        <StatCard label="登録済み内線" value={String(extensionCount)} href="/extensions" hint={mtimeHint} />
        <StatCard
          label="オンライン端末"
          value={onlineLabel}
          href={showDevices ? '/devices' : undefined}
          hint={showDevices ? (deviceSummary.amiReady ? 'AMI 接続中' : 'AMI 未接続') : undefined}
        />
        <StatCard
          label="Inbox wav"
          value={inbox.wav < 0 ? '—' : String(inbox.wav)}
          href="/inbox"
          hint="未受領 / 待機"
        />
        <StatCard
          label="Inbox meta"
          value={inbox.meta < 0 ? '—' : String(inbox.meta)}
          href="/inbox"
          hint="event JSON"
        />
      </section>
      <PageSection title={`登録済み内線 (${extensionCount})`}>
        {extensions.length === 0 ? (
          <p className="text-sm text-slate-500">内線がまだ登録されていません。</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {extensions.map((e) => (
              <li
                key={e.number}
                className="flex items-baseline gap-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="font-mono text-base font-semibold">{e.number}</span>
                <span className="truncate text-slate-700">{e.displayName ?? '—'}</span>
                {e.note ? <span className="ml-auto text-xs text-slate-500">{e.note}</span> : null}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs">
          <Link className="text-blue-600 hover:underline" href="/extensions">
            → 端末を追加・編集する
          </Link>
        </p>
      </PageSection>
    </div>
  );
}
