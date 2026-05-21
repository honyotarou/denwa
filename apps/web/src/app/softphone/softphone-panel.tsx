'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
  nextStateOnRegisterClick,
  nextStateOnRegisterFail,
  nextStateOnRegisterOk,
  nextStateOnIncoming,
  nextStateOnDialClick,
  nextStateOnHangup,
  nextStateOnUnregister,
  validateDialTarget,
  type SoftphoneUiState,
} from '@openpbx/core/softphone/state';
import { classifySipRegisterFailure } from '@openpbx/core/softphone/register-error';
import { createSipJsAdapter } from '@/client/softphone/sip-js-adapter';
import type { SipAdapter } from '@/client/softphone/types';

export type SoftphoneProfile = Readonly<{ number: string; secret?: string }>;

export function SoftphonePanel({
  profiles,
  defaultHost,
  adapterFactory = createSipJsAdapter,
}: {
  profiles: SoftphoneProfile[];
  defaultHost: string;
  adapterFactory?: (audio: HTMLAudioElement | null) => SipAdapter;
}) {
  const [selected, setSelected] = useState(profiles[0]?.number ?? '');
  const [host, setHost] = useState(defaultHost);
  const [target, setTarget] = useState('');
  const [status, setStatus] = useState<SoftphoneUiState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [incomingFrom, setIncomingFrom] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const adapterRef = useRef<SipAdapter | null>(null);

  const profile = profiles.find((p) => p.number === selected);

  const ensureAdapter = useCallback(() => {
    if (!adapterRef.current) {
      adapterRef.current = adapterFactory(audioRef.current);
    }
    return adapterRef.current;
  }, [adapterFactory]);

  async function register() {
    setError(null);
    setIncomingFrom(null);
    setStatus(nextStateOnRegisterClick(status));
    if (!profile?.secret) {
      setStatus(nextStateOnRegisterFail());
      setError('WebRTC 内線が未割当です（admin または内線割当が必要）');
      return;
    }
    const adapter = ensureAdapter();
    await adapter.register(
      { extension: profile.number, secret: profile.secret, host },
      {
        onRegistered: () => setStatus(nextStateOnRegisterOk()),
        onRegisterFailed: (msg) => {
          setStatus(nextStateOnRegisterFail());
          setError(classifySipRegisterFailure(msg).userMessage);
        },
        onIncoming: (from) => {
          setIncomingFrom(from);
          setStatus(nextStateOnIncoming());
        },
        onInCall: () => setStatus('inCall'),
        onEnded: () => {
          setIncomingFrom(null);
          setStatus('registered');
        },
        onError: (msg) => {
          setStatus('error');
          setError(classifySipRegisterFailure(msg).userMessage);
        },
      },
    );
  }

  async function unregister() {
    await adapterRef.current?.unregister();
    adapterRef.current = null;
    setStatus(nextStateOnUnregister(status));
    setIncomingFrom(null);
  }

  async function dial() {
    const err = validateDialTarget(target);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    try {
      await ensureAdapter().dial(target);
      setStatus(nextStateOnDialClick(status));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function answer() {
    try {
      await ensureAdapter().answer();
      setStatus('inCall');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function hangup() {
    await ensureAdapter().hangup();
    setStatus(nextStateOnHangup(status));
    setIncomingFrom(null);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    ensureAdapter().setMuted(next);
  }

  async function dtmf(digit: string) {
    await ensureAdapter().sendDtmf(digit);
  }

  if (profiles.length === 0) {
    return (
      <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        WebRTC 有効な内線がありません。/extensions で WebRTC を ON にし、user には /accounts で内線割当が必要です。
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
        WSS ホスト（Asterisk / mkcert）
        <input
          className="mt-1 w-full rounded border px-2 py-1 font-mono text-sm"
          value={host}
          onChange={(e) => setHost(e.target.value)}
        />
      </label>
      <p className="text-xs text-slate-500" data-testid="softphone-status">
        状態: {status}
        {incomingFrom ? ` / 着信 ${incomingFrom}` : ''}
      </p>
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={register} className="rounded bg-blue-600 px-3 py-1 text-xs text-white">
          SIP 登録
        </button>
        <button type="button" onClick={unregister} className="rounded border px-3 py-1 text-xs">
          登録解除
        </button>
        <input
          className="rounded border px-2 py-1 font-mono text-sm"
          placeholder="発信先"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <button type="button" onClick={dial} className="rounded bg-emerald-600 px-3 py-1 text-xs text-white">
          発信
        </button>
        <button type="button" onClick={answer} className="rounded bg-blue-600 px-3 py-1 text-xs text-white">
          応答
        </button>
        <button type="button" onClick={hangup} className="rounded bg-red-600 px-3 py-1 text-xs text-white">
          切断
        </button>
        <button type="button" onClick={toggleMute} className="rounded border px-3 py-1 text-xs">
          {muted ? 'ミュート解除' : 'ミュート'}
        </button>
      </div>
      <div className="flex gap-1">
        {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => dtmf(d)}
            className="rounded border px-2 py-0.5 font-mono text-xs"
          >
            {d}
          </button>
        ))}
      </div>
      <audio ref={audioRef} autoPlay playsInline />
      <p className="text-xs text-slate-400">
        WSS: wss://{host}:8089/ws — 証明書は legacy OpenPBX README / mkcert 手順を参照
      </p>
    </div>
  );
}
