'use client';

import {
  deviceActivityDisplayLabel,
  registrationAriaLabel,
  registrationDisplayLabel,
  type DeviceActivityState,
} from '@openpbx/core/home/device-present';
import { useEffect, useState } from 'react';

type DeviceInfo = {
  device: string;
  extension: string | null;
  state: DeviceActivityState;
  updatedAt?: string;
  reachable?: boolean | null;
  contact?: string | null;
};

const STATE_TONE: Record<DeviceActivityState, string> = {
  unknown: 'bg-slate-100 text-slate-700 border-slate-300',
  not_inuse: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  inuse: 'bg-blue-50 text-blue-800 border-blue-300',
  busy: 'bg-orange-50 text-orange-800 border-orange-300',
  invalid: 'bg-red-50 text-red-800 border-red-300',
  unavailable: 'bg-slate-100 text-slate-500 border-slate-300',
  ringing: 'bg-amber-50 text-amber-800 border-amber-300',
  ringinuse: 'bg-amber-50 text-amber-800 border-amber-300',
  onhold: 'bg-violet-50 text-violet-800 border-violet-300',
};

interface Props {
  initialDevices: DeviceInfo[];
  initialConnected: boolean;
}

export function DeviceList({ initialDevices, initialConnected }: Props) {
  const filter = (d: DeviceInfo[]) => d.filter((x) => x.device.startsWith('PJSIP/') && x.extension);
  const [devices, setDevices] = useState<DeviceInfo[]>(filter(initialDevices));
  const [connected, setConnected] = useState<boolean>(initialConnected);
  const allUnregistered =
    connected && devices.length > 0 && devices.every((d) => d.reachable !== true);

  useEffect(() => {
    const es = new EventSource('/api/devices/stream');
    es.addEventListener('snapshot', (ev) => {
      try {
        const payload = JSON.parse((ev as MessageEvent).data) as {
          devices: DeviceInfo[];
          connected: boolean;
        };
        setDevices(filter(payload.devices));
        setConnected(payload.connected);
      } catch {
        /* ignore */
      }
    });
    return () => es.close();
  }, []);

  return (
    <section className="space-y-3" aria-label="端末一覧">
      <div className="flex items-center gap-2 text-xs">
        <span
          aria-label={connected ? 'AMI 接続中' : 'AMI 未接続'}
          className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}
        />
        <span className="text-slate-600">{connected ? 'AMI 接続中' : 'AMI 未接続'}</span>
      </div>
      {allUnregistered && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          内線は Asterisk に存在しますが、SIP 端末が REGISTER していません。Groundwire 等で Server =
          Mac の LAN IP、Port 5060（通らない場合 15060）、Username / Password = /extensions
          の内線番号・secret を設定してください。ブラウザ /softphone の場合は WebRTC 内線 +
          dev overlay（8089 公開）が必要です。
        </p>
      )}
      {devices.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          {connected
            ? 'PJSIP 内線がまだありません。/extensions で内線を追加してください。'
            : 'AMI 未接続のため端末一覧を取得できません。Docker / Asterisk の起動を確認してください。'}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {devices.map((d) => (
            <li
              key={d.device}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            >
              <span className="font-mono text-lg font-semibold">{d.extension ?? d.device}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATE_TONE[d.state]}`}
              >
                {deviceActivityDisplayLabel(d.state, d.reachable ?? null)}
              </span>
              <span
                className={`text-xs ${d.reachable ? 'text-emerald-700' : 'text-slate-400'}`}
                aria-label={registrationAriaLabel(d.reachable)}
              >
                {registrationDisplayLabel(d.reachable)}
              </span>
              {d.contact && (
                <span className="ml-auto truncate font-mono text-[10px] text-slate-400">{d.contact}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-400">
        SSE で自動更新。「○ 未登録」= REGISTER なし、「オフライン」= 通話状態不明、「到達不可」=
        以前登録があったが応答なし。
      </p>
    </section>
  );
}
