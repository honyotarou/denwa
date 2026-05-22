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
  softphoneStatusLabel,
  validateDialTarget,
  type SoftphoneUiState,
} from '@openpbx/core/softphone/state';
import { classifySipRegisterFailure } from '@openpbx/core/softphone/register-error';
import { buildWssTransportUrl } from '@openpbx/core/softphone/wss';
import { createSipJsAdapter } from '@/client/softphone/sip-js-adapter';
import type { SipAdapter } from '@/client/softphone/types';

export type SoftphoneProfile = Readonly<{ number: string; secret?: string }>;

const DTMF_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
] as const;

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
  const wssUrl = buildWssTransportUrl(host);
  const isRegistered =
    status === 'registered' || status === 'incoming' || status === 'inCall';
  const canAnswer = status === 'incoming';
  const canHangup = status === 'inCall' || status === 'incoming';

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
    const certHint = classifySipRegisterFailure('NET::ERR_CERT_AUTHORITY_INVALID').userMessage;
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      setStatus(nextStateOnRegisterFail());
      setError(
        `${certHint} または WSS 8089 / softphone-dev overlay が起動しているか確認してください。`,
      );
    }, 12_000);
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      fn();
    };
    await adapter.register(
      { extension: profile.number, secret: profile.secret, host },
      {
        onRegistered: () => done(() => setStatus(nextStateOnRegisterOk())),
        onRegisterFailed: (msg) => {
          done(() => {
            setStatus(nextStateOnRegisterFail());
            setError(classifySipRegisterFailure(msg).userMessage);
          });
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
    <section className="min-w-0 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <label className="block text-xs text-slate-600">
          内線
          <select
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
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
          Asterisk ホスト
          <input
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 font-mono text-sm"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="localhost"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={register}
            disabled={status === 'registering'}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            登録
          </button>
          <button
            type="button"
            onClick={unregister}
            disabled={!isRegistered && status !== 'registering'}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
          >
            切断
          </button>
        </div>
      </div>

      <div
        className="text-xs text-slate-600"
        data-testid="softphone-status"
        data-state={status}
      >
        状態: {softphoneStatusLabel(status)}
        {incomingFrom ? ` — 着信 ${incomingFrom}` : ''}
      </div>
      {error ? (
        <p className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2">
        <input
          className="min-w-0 rounded border border-slate-300 px-2 py-1.5 font-mono text-sm"
          placeholder="発信先 (例: 1002)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          disabled={status !== 'registered'}
        />
        <button
          type="button"
          onClick={dial}
          disabled={status !== 'registered'}
          className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          発信
        </button>
        <button
          type="button"
          onClick={answer}
          disabled={!canAnswer}
          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          応答
        </button>
        <button
          type="button"
          onClick={hangup}
          disabled={!canHangup}
          className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          切る
        </button>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-600">通話中操作</span>
          <button
            type="button"
            onClick={toggleMute}
            disabled={!isRegistered}
            className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-50"
          >
            {muted ? 'ミュート解除' : 'ミュート'}
          </button>
        </div>
        <div className="grid w-fit max-w-full grid-cols-3 gap-1">
          {DTMF_ROWS.flat().map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => dtmf(digit)}
              disabled={!isRegistered}
              className="h-9 w-11 rounded border border-slate-300 bg-slate-50 font-mono text-sm font-medium disabled:opacity-40"
            >
              {digit}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        WSS: <code className="rounded bg-slate-100 px-1">{wssUrl}</code>
        {' — '}
        <code className="rounded bg-slate-100 px-1">npm run gen-dev-asterisk-certs</code>
        {' → softphone-dev overlay で asterisk 起動'}
      </p>

      <audio ref={audioRef} autoPlay playsInline className="hidden" />
    </section>
  );
}
