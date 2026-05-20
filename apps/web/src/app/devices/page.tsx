import { guardPage } from '@/lib/auth';
import { DeviceList } from './device-list';

export const dynamic = 'force-dynamic';

export default async function DevicesPage() {
  await guardPage('user');
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">端末状態 (AMI SSE)</h2>
        <p className="text-xs text-slate-500">内線の登録状態をリアルタイムで表示します。</p>
      </header>
      <DeviceList initialDevices={[]} initialConnected={false} />
    </div>
  );
}
