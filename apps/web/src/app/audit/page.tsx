import { guardPage } from '@/lib/auth';
import { getAuditLog, getLoginHistory } from '@/server/page-data';
import { formatJst } from '@/lib/datetime';
import { PageHeader } from '@/components/PageHeader';
import { PageSection } from '@/components/PageSection';
import { DataTableShell } from '@/components/DataTableShell';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  await guardPage('supervisor');
  const audit = getAuditLog(200);
  const logins = getLoginHistory(100);
  return (
    <div className="space-y-6">
      <PageHeader
        title="操作 / ログイン履歴"
        description="設定変更や認証イベントの監査ログ (最新 200 + 100 件)。"
      />

      <PageSection title={`操作履歴 (${audit.length})`}>
        <DataTableShell>
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-2 py-1 text-left" scope="col">
                  時刻 (JST)
                </th>
                <th className="px-2 py-1 text-left" scope="col">
                  操作者
                </th>
                <th className="px-2 py-1 text-left" scope="col">
                  アクション
                </th>
                <th className="px-2 py-1 text-left" scope="col">
                  対象
                </th>
                <th className="px-2 py-1 text-left" scope="col">
                  IP
                </th>
                <th className="px-2 py-1 text-left" scope="col">
                  詳細
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {audit.map((a, i) => (
                <tr key={i}>
                  <td className="px-2 py-1 font-mono">{formatJst(a.created_at)}</td>
                  <td className="px-2 py-1 font-mono">{a.actor ?? '—'}</td>
                  <td className="px-2 py-1 font-mono">{a.action}</td>
                  <td className="px-2 py-1 font-mono">{a.target ?? '—'}</td>
                  <td className="px-2 py-1 font-mono">{a.ip ?? '—'}</td>
                  <td className="px-2 py-1 font-mono">{a.details ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </PageSection>

      <PageSection title={`ログイン履歴 (${logins.length})`}>
        <DataTableShell>
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-2 py-1 text-left" scope="col">
                  時刻 (JST)
                </th>
                <th className="px-2 py-1 text-left" scope="col">
                  username
                </th>
                <th className="px-2 py-1 text-left" scope="col">
                  結果
                </th>
                <th className="px-2 py-1 text-left" scope="col">
                  IP
                </th>
                <th className="px-2 py-1 text-left" scope="col">
                  User-Agent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logins.map((l, i) => (
                <tr key={i}>
                  <td className="px-2 py-1 font-mono">{formatJst(l.created_at)}</td>
                  <td className="px-2 py-1 font-mono">{l.username}</td>
                  <td className="px-2 py-1">
                    <span
                      className={`rounded-full border px-2 py-0.5 ${
                        l.success
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-red-300 bg-red-50 text-red-800'
                      }`}
                    >
                      {l.success ? '成功' : '失敗'}
                    </span>
                  </td>
                  <td className="px-2 py-1 font-mono">{l.ip ?? '—'}</td>
                  <td className="max-w-xs truncate px-2 py-1 font-mono">{l.user_agent ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </PageSection>
    </div>
  );
}
