'use client';

import { useState } from 'react';
import {
  nextStateOnRegisterClick,
  nextStateOnRegisterFail,
  nextStateOnRegisterOk,
  validateDialTarget,
  type SoftphoneUiState,
} from '@openpbx/core';

export type SoftphoneProfile = Readonly<{ number: string; secret?: string }>;

export function SoftphonePanel({
  profiles,
  defaultHost,
}: {
  profiles: SoftphoneProfile[];
  defaultHost: string;
}) {
  const [selected, setSelected] = useState(profiles[0]?.number ?? '');
  const [host, setHost] = useState(defaultHost);
  const [target, setTarget] = useState('');
  const [status, setStatus] = useState<SoftphoneUiState>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const profile = profiles.find((p) => p.number === selected);

  function register() {
    setError(null);
    setStatus(nextStateOnRegisterClick(status));
    if (!profile?.secret) {
      setStatus(nextStateOnRegisterFail());
      setError('WebRTC 内線が未割当、または admin 権限が必要です');
      return;
    }
    setStatus(nextStateOnRegisterOk());
    setError(
      'sip.js 接続は npm 依存導入後に有効化します。現状は状態機械のみ。WSS: wss://' +
        host +
        ':8089/ws',
    );
  }

  function dial() {
    const err = validateDialTarget(target);
    if (err) {
      setError(err);
      return;
    }
    setError(`発信 ${target} は SipAdapter 実装後に接続されます`);
  }

  if (profiles.length === 0) {
    return (
      <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        WebRTC 有効な内線がありません。/extensions で WebRTC を ON にし、admin でログインしてください。
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <label className="block text-xs text-slate-600">
        内線
        <select
          className="mt-1 w-full rounded border px-2 py-1 text-sm"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {profiles.map((p) => (
            <option key={p.number} value={p.number}>
              {p.number}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-slate-600">
        WSS ホスト
        <input
          className="mt-1 w-full rounded border px-2 py-1 font-mono text-sm"
          value={host}
          onChange={(e) => setHost(e.target.value)}
        />
      </label>
      <p className="text-xs text-slate-500">状態: {status}</p>
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={register} className="rounded bg-blue-600 px-3 py-1 text-xs text-white">
          登録（スタブ）
        </button>
        <input
          className="rounded border px-2 py-1 font-mono text-sm"
          placeholder="発信先"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <button type="button" onClick={dial} className="rounded bg-slate-700 px-3 py-1 text-xs text-white">
          発信（スタブ）
        </button>
      </div>
    </div>
  );
}
