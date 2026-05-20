import { guardPage } from '@/lib/auth';
import { listRecordingsForUi } from '@/server/page-data';
import { formatBytes } from '@/lib/format';
export const dynamic = 'force-dynamic';
export default async function RecordingsPage() {
  await guardPage('user');
  const files = await listRecordingsForUi();
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">録音一覧</h2>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm"><thead><tr className="text-slate-500"><th>ファイル</th><th>サイズ</th><th>再生</th></tr></thead>
        <tbody>{files.map((f) => (
          <tr key={f.name} className="border-t"><td className="font-mono text-xs">{f.name}</td><td>{formatBytes(f.size)}</td>
          <td><audio controls preload="none" src={`/api/recordings/${encodeURIComponent(f.name)}`} className="h-8 max-w-xs" /></td></tr>
        ))}</tbody></table>
        {files.length === 0 && <p className="p-4 text-sm text-slate-500">録音がまだありません</p>}
      </div>
    </div>
  );
}
