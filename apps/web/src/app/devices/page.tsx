import { guardPage } from '@/lib/auth';
import { getAmiDeviceSession } from '@/server/ports/ami-devices';
import { listDeviceSnapshotsForUi } from '@/server/page-data';
import { formatJst } from '@/lib/datetime';
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
      <header>
        <h2 className="text-lg font-semibold">端末状態 (AMI SSE)</h2>
        <p className="text-xs text-slate-500">
          内線の登録状態をリアルタイム表示。1 分ごとに SQLite へスナップショット保存（AMI 接続時）。
        </p>
      </header>
      <DeviceList initialDevices={[...devices]} initialConnected={session.isConnected()} />
      {history.length > 0 && (
        <section className="rounded border bg-white p-4 text-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">スナップショット履歴</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500">
                <th>時刻</th>
                <th>オンライン</th>
                <th>端末数</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-t">
                  <td>{formatJst(h.snapshotAt)}</td>
                  <td className="tabular-nums">{h.onlineCount}</td>
                  <td className="tabular-nums">{h.deviceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
