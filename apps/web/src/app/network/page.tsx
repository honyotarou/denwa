import os from 'node:os';
import { requireRole } from '@/lib/auth';
import { getNetworkSettingsForUi } from '@/server/page-data';
import { updateNetworkAction } from '@/app/actions';
import { PageHeader } from '@/components/PageHeader';
import { PageSection } from '@/components/PageSection';

export const dynamic = 'force-dynamic';

function listLocalIps(): Array<{ iface: string; address: string }> {
  const out: Array<{ iface: string; address: string }> = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    if (!list) continue;
    for (const a of list) {
      if (a.family === 'IPv4' && !a.internal) out.push({ iface: name, address: a.address });
    }
  }
  return out;
}

export default async function NetworkPage() {
  await requireRole('admin');
  const net = getNetworkSettingsForUi();
  const ips = listLocalIps();
  const tailscaleCandidates = ips.filter((i) => {
    const [first, second] = i.address.split('.').map(Number);
    return first === 100 && second >= 64 && second <= 127;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="ネットワーク / 外線アドレス"
        description="Tailscale / WAN 越しの SIP・RTP 用。保存すると data/pbx-out/pjsip.d/transports.conf に反映されます。"
      />

      <PageSection title="このホストから見える IPv4">
        {ips.length === 0 ? (
          <p className="text-sm text-slate-500">IPv4 が見つかりません。</p>
        ) : (
          <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
            {ips.map((i) => (
              <li key={`${i.iface}-${i.address}`} className="flex gap-3">
                <span className="w-24 font-mono text-slate-500">{i.iface}</span>
                <span className="font-mono">{i.address}</span>
              </li>
            ))}
          </ul>
        )}
        {tailscaleCandidates.length > 0 && (
          <p className="mt-2 text-xs text-emerald-700">
            Tailscale 候補: {tailscaleCandidates.map((i) => i.address).join(', ')}
          </p>
        )}
      </PageSection>

      <PageSection title="外部アドレス設定">
        <form action={updateNetworkAction} className="space-y-3">
          <label className="block text-xs text-slate-600">
            External Media Address (RTP)
            <input
              name="externalIp"
              defaultValue={net.externalIp ?? ''}
              placeholder="例: 100.64.1.23"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
            />
          </label>
          <label className="block text-xs text-slate-600">
            External Signaling Address (SIP)
            <input
              name="externalSignalingIp"
              defaultValue={net.externalSignalingIp ?? ''}
              placeholder="通常は Media と同じ"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
            />
          </label>
          <label className="block text-xs text-slate-600">
            Local Net (CIDR、カンマ区切り)
            <input
              name="localNet"
              defaultValue={net.localNet ?? ''}
              placeholder="100.64.0.0/10, 192.168.0.0/16"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
            />
          </label>
          <button type="submit" className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
            保存 + Asterisk reload
          </button>
        </form>
        <p className="mt-3 text-[11px] text-slate-500">
          最終更新: <span className="font-mono">{net.updatedAt || '—'}</span>
        </p>
      </PageSection>
    </div>
  );
}
