import Link from 'next/link';
import { guardPage } from '@/lib/auth';
import { listInboxForUi } from '@/server/page-data';
import { formatJst } from '@/lib/datetime';
import { PageHeader } from '@/components/PageHeader';
import { DataTableShell } from '@/components/DataTableShell';

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  await guardPage('user');
  const rows = await listInboxForUi(100);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox（Asterisk イベント）"
        description="notify-event.sh が meta.json と wav を data/inbox に投下。表示時に SQLite へ索引同期します。"
      />
      <DataTableShell>
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-1 text-left" scope="col">受信</th>
              <th className="px-2 py-1 text-left" scope="col">kind</th>
              <th className="px-2 py-1 text-left" scope="col">内線</th>
              <th className="px-2 py-1 text-left" scope="col">発信者</th>
              <th className="px-2 py-1 text-left" scope="col">uniqueid</th>
              <th className="px-2 py-1 text-left" scope="col">wav</th>
              <th className="px-2 py-1 text-left" scope="col">再生</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((r) => (
              <tr key={r.metaName}>
                <td className="px-2 py-1">{r.receivedAt ? formatJst(r.receivedAt) : '—'}</td>
                <td className="px-2 py-1 font-mono">{r.kind ?? '—'}</td>
                <td className="px-2 py-1 font-mono">{r.extension ?? '—'}</td>
                <td className="px-2 py-1 font-mono">{r.callerId ?? '—'}</td>
                <td className="px-2 py-1 font-mono">
                  {r.uniqueid ? (
                    <Link href="/cdr" className="text-blue-600 hover:underline">
                      {r.uniqueid}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-2 py-1 font-mono">{r.wavName ?? '—'}</td>
                <td className="px-2 py-1">
                  {r.wavName ? (
                    <audio
                      controls
                      preload="none"
                      src={`/api/inbox/${encodeURIComponent(r.wavName)}`}
                      className="h-8 max-w-xs"
                    />
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-4 text-sm text-slate-500">Inbox にイベントはまだありません。</p>
        )}
      </DataTableShell>
    </div>
  );
}
