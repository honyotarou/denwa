import Link from 'next/link';
import { guardPage } from '@/lib/auth';
import { listRecordingsForUi } from '@/server/page-data';
import { formatBytes } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { DataTableShell } from '@/components/DataTableShell';

export const dynamic = 'force-dynamic';

export default async function RecordingsPage() {
  await guardPage('supervisor');
  const files = await listRecordingsForUi();
  return (
    <div className="space-y-6">
      <PageHeader
        title="通話録音"
        description="ファイルは data/recordings、索引は SQLite（表示時に同期）。uniqueid がある行は /cdr と紐づきます。"
      />
      <DataTableShell>
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-2 py-1 text-left" scope="col">
                ファイル
              </th>
              <th className="px-2 py-1 text-left" scope="col">
                uniqueid
              </th>
              <th className="px-2 py-1 text-left" scope="col">
                サイズ
              </th>
              <th className="px-2 py-1 text-left" scope="col">
                再生
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {files.map((f) => (
              <tr key={f.name}>
                <td className="px-2 py-1 font-mono">{f.name}</td>
                <td className="px-2 py-1 font-mono">
                  {f.uniqueid ? (
                    <Link href="/cdr" className="text-blue-600 hover:underline">
                      {f.uniqueid}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-2 py-1">{formatBytes(f.size)}</td>
                <td className="px-2 py-1">
                  <audio
                    controls
                    preload="none"
                    src={`/api/recordings/${encodeURIComponent(f.name)}`}
                    className="h-8 max-w-xs"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>
    </div>
  );
}
