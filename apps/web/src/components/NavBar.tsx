'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Account } from '@/lib/auth';
import { showDevicesLink, showNetworkLink, showRecordingsLink } from '@/lib/nav-policy';

const baseLinkCls =
  'rounded px-2 py-1 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
  return (
    <Link
      className={`${baseLinkCls}${active ? ' bg-slate-100' : ''}`}
      href={href}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}

/** OpenPBX ナビ順 + denwa 独自（Inbox / 課金） */
export function NavBar({ me }: { me: Account }) {
  const sup = me.role === 'supervisor' || me.role === 'admin';
  const adm = showNetworkLink(me.role);

  return (
    <nav
      className="flex flex-1 items-center gap-3 overflow-x-auto text-sm"
      aria-label="メインナビゲーション"
    >
      <NavLink href="/">概要</NavLink>
      {showDevicesLink(me.role) && <NavLink href="/devices">端末状態</NavLink>}
      <NavLink href="/cdr">履歴</NavLink>
      {showRecordingsLink(me.role) && <NavLink href="/recordings">録音</NavLink>}
      <NavLink href="/inbox">Inbox</NavLink>
      <NavLink href="/concurrency">同時通話</NavLink>
      <NavLink href="/softphone">ソフトフォン</NavLink>
      <NavLink href="/triage">問診フロー</NavLink>
      <NavLink href="/patients">患者</NavLink>
      <NavLink href="/extensions">端末管理</NavLink>
      <NavLink href="/ring-groups">着信グループ</NavLink>
      <NavLink href="/pickup-groups">ピックアップ</NavLink>
      <NavLink href="/phonebook">電話帳</NavLink>
      <NavLink href="/business-hours">営業時間</NavLink>
      <NavLink href="/ivr">IVR</NavLink>
      <NavLink href="/guidances">ガイダンス</NavLink>
      {sup && <NavLink href="/audit">監査</NavLink>}
      {sup && <NavLink href="/billing">課金</NavLink>}
      {adm && <NavLink href="/network">ネットワーク</NavLink>}
      {adm && <NavLink href="/trunks">外線</NavLink>}
      {adm && <NavLink href="/accounts">アカウント</NavLink>}
      {adm && <NavLink href="/security">セキュリティ</NavLink>}
      {adm && <NavLink href="/upgrades">Upgrade</NavLink>}
      <Link className={`${baseLinkCls} ml-auto text-slate-500`} href="/me">
        👤 {me.username}
      </Link>
    </nav>
  );
}
