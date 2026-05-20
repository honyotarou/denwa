import { guardPage } from '@/lib/auth';
import { listInboxForUi } from '@/server/page-data';
import { formatJst } from '@/lib/datetime';

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  await guardPage('user');
  const rows = await listInboxForUi(100);
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">Inbox（Asterisk イベント）</h2>
        <p className="text-xs text-slate-500">
          9001/9002 等の録音終了後、notify-event.sh が meta.json と wav を data/inbox に投下します。
        </p>
      </header>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th>受信</th>
              <th>kind</th>
              <th>内線</th>
              <th>発信者</th>
              <th>wav</th>
              <th>再生</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.metaName} className="border-t">
                <td>{r.receivedAt ? formatJst(r.receivedAt) : '—'}</td>
                <td className="font-mono text-xs">{r.kind ?? '—'}</td>
                <td className="font-mono">{r.extension ?? '—'}</td>
                <td className="font-mono">{r.callerId ?? '—'}</td>
                <td className="font-mono text-xs">{r.wavName ?? '—'}</td>
                <td>
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
      </div>
    </div>
  );
}
