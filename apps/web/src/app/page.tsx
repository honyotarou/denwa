import Link from 'next/link';
import { guardPage } from '@/lib/auth';
import { formatJst } from '@/lib/datetime';
import { getHomeSummary } from '@/server/page-data';

export const dynamic = 'force-dynamic';

function Card({ label, value, href, hint }: { label: string; value: string; href?: string; hint?: string }) {
  const inner = (
    <>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {hint && <div className="text-[10px] text-slate-400">{hint}</div>}
    </>
  );
  const cls = 'block rounded border border-slate-200 bg-white p-3 shadow-sm hover:bg-slate-50';
  return href ? <Link href={href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

export default async function HomePage() {
  await guardPage('user');
  const { extensionCount, extensions, inbox, deviceSummary, extensionsMtime } = await getHomeSummary();
  const onlineLabel =
    !deviceSummary.amiReady || deviceSummary.online === null
      ? '—'
      : `${deviceSummary.online} / ${deviceSummary.total ?? 0}`;
  const mtimeHint = extensionsMtime ? `PJSIP 更新 ${formatJst(extensionsMtime)}` : 'extensions.conf 未取得';
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">PBX 概要</h2>
        <p className="text-xs text-slate-500">Asterisk ベース PBX の状態と設定への入り口。</p>
      </header>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="サマリー">
        <Card label="登録済み内線" value={String(extensionCount)} href="/extensions" hint={mtimeHint} />
        <Card label="オンライン端末" value={onlineLabel} href="/devices" hint="PJSIP / AMI" />
        <Card label="Inbox wav" value={inbox.wav < 0 ? '—' : String(inbox.wav)} href="/inbox" hint="待機" />
        <Card label="Inbox meta" value={inbox.meta < 0 ? '—' : String(inbox.meta)} href="/inbox" hint="event JSON" />
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">登録済み内線 ({extensionCount})</h3>
        {extensions.length === 0 ? (
          <p className="text-sm text-slate-500">内線がまだ登録されていません。<Link className="text-blue-600 hover:underline" href="/extensions">内線を追加</Link></p>
        ) : (
          <ul className="divide-y divide-slate-200 text-sm">
            {extensions.slice(0, 12).map((e) => (
              <li key={e.number} className="flex justify-between py-2">
                <span className="font-mono tabular-nums">{e.number}</span>
                <span className="text-slate-600">{e.displayName ?? '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
