import Link from 'next/link';
import type { Account } from '@/lib/auth';
import { showDevicesLink, showNetworkLink, showRecordingsLink } from '@/lib/nav-policy';

const linkCls =
  'rounded px-2 py-1 whitespace-nowrap hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

export function NavBar({ me }: { me: Account | null }) {
  if (!me) return null;
  const sup = me.role === 'supervisor' || me.role === 'admin';
  const adm = showNetworkLink(me.role);
  return (
    <nav
      className="flex flex-1 items-center gap-3 overflow-x-auto text-sm"
      aria-label="メインナビゲーション"
    >
      <Link className={linkCls} href="/">概要</Link>
      {showDevicesLink(me.role) && <Link className={linkCls} href="/devices">端末状態</Link>}
      <Link className={linkCls} href="/extensions">内線</Link>
      <Link className={linkCls} href="/ring-groups">着信G</Link>
      <Link className={linkCls} href="/pickup-groups">Pickup</Link>
      <Link className={linkCls} href="/phonebook">電話帳</Link>
      <Link className={linkCls} href="/business-hours">営業時間</Link>
      <Link className={linkCls} href="/ivr">IVR</Link>
      <Link className={linkCls} href="/guidances">ガイダンス</Link>
      <Link className={linkCls} href="/cdr">履歴</Link>
      {showRecordingsLink(me.role) && <Link className={linkCls} href="/recordings">録音</Link>}
      <Link className={linkCls} href="/inbox">Inbox</Link>
      <Link className={linkCls} href="/concurrency">同時通話</Link>
      <Link className={linkCls} href="/triage">問診</Link>
      <Link className={linkCls} href="/patients">患者</Link>
      <Link className={linkCls} href="/softphone">ソフトフォン</Link>
      {adm && <Link className={linkCls} href="/network">ネットワーク</Link>}
      {sup && <Link className={linkCls} href="/billing">課金</Link>}
      {sup && <Link className={linkCls} href="/audit">監査</Link>}
      {adm && <Link className={linkCls} href="/accounts">アカウント</Link>}
      {adm && <Link className={linkCls} href="/security">セキュリティ</Link>}
      {adm && <Link className={linkCls} href="/trunks">Trunk</Link>}
      {adm && <Link className={linkCls} href="/upgrades">Upgrade</Link>}
      <Link className={`${linkCls} ml-auto text-slate-500`} href="/me">👤 {me.username}</Link>
    </nav>
  );
}
