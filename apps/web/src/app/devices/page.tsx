import { guardPage } from '@/lib/auth';
import { formatJst } from '@/lib/datetime';
import { getAmiDeviceSession } from '@/server/ports/ami-devices';
import { listDeviceSnapshotsForUi } from '@/server/page-data';
import { PageHeader } from '@/components/PageHeader';
import { PageSection } from '@/components/PageSection';
import { DataTableShell } from '@/components/DataTableShell';
import { DeviceList } from './device-list';

export const dynamic = 'force-dynamic';

export default async function DevicesPage() {
  await guardPage('supervisor');
  const session = getAmiDeviceSession();
  session.start();
  const devices = session.getDevices();
  const history = listDeviceSnapshotsForUi(12);
  return (
    <div className="space-y-6">
      <PageHeader
        title="端末ライブ状態"
        description="内線の登録状態をリアルタイム表示。1 分ごとに SQLite へスナップショット保存（AMI 接続時）。"
      />
      <DeviceList initialDevices={[...devices]} initialConnected={session.isConnected()} />
      {history.length > 0 && (
        <PageSection title="スナップショット履歴">
          <DataTableShell>
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-2 py-1 text-left" scope="col">
                    時刻
                  </th>
                  <th className="px-2 py-1 text-left" scope="col">
                    オンライン
                  </th>
                  <th className="px-2 py-1 text-left" scope="col">
                    端末数
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="px-2 py-1 font-mono">{formatJst(h.snapshotAt)}</td>
                    <td className="px-2 py-1 tabular-nums">{h.onlineCount}</td>
                    <td className="px-2 py-1 tabular-nums">{h.deviceCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableShell>
        </PageSection>
      )}
    </div>
  );
}
