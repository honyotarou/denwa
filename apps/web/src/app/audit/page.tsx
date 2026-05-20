import { guardPage } from '@/lib/auth';
import { getAuditLog, getLoginHistory } from '@/server/page-data';
import { formatJst } from '@/lib/datetime';
export const dynamic = 'force-dynamic';
export default async function AuditPage() {
  await guardPage('supervisor');
  const audit = getAuditLog(200);
  const logins = getLoginHistory(100);
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">監査ログ</h2>
      <div className="max-h-[40vh] overflow-y-auto rounded border bg-white text-sm">
        <table className="w-full"><thead className="sticky top-0 bg-white"><tr className="text-slate-500"><th>時刻</th><th>action</th></tr></thead>
        <tbody>{audit.map((a, i) => (<tr key={i} className="border-t"><td>{formatJst(a.created_at)}</td><td>{a.action}</td></tr>))}</tbody></table>
      </div>
      <h3 className="text-sm font-semibold text-slate-700">ログイン履歴</h3>
      <ul className="text-sm">{logins.map((l, i) => (<li key={i}>{formatJst(l.created_at)} {l.username} {l.success ? 'success' : 'failed'}</li>))}</ul>
    </div>
  );
}
