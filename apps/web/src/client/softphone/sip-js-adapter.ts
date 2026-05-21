'use client';

import {
  Inviter,
  Registerer,
  SessionState,
  UserAgent,
  type Invitation,
  type Session,
} from 'sip.js';
import { classifySipRegisterFailure } from '@openpbx/core/softphone/register-error';
import { buildWssTransportUrl } from '@openpbx/core/softphone/wss';
import type { SipAdapter, SipAdapterCallbacks, SipAdapterConfig } from './types';

function attachRemoteAudio(session: Session, audio: HTMLAudioElement | null): void {
  if (!audio) return;
  const sdh = session.sessionDescriptionHandler;
  if (!sdh || !('peerConnection' in sdh)) return;
  const pc = (sdh as { peerConnection?: RTCPeerConnection }).peerConnection;
  if (!pc) return;
  pc.addEventListener('track', (ev: RTCTrackEvent) => {
    if (ev.streams[0]) audio.srcObject = ev.streams[0];
  });
}

export function createSipJsAdapter(audioEl: HTMLAudioElement | null): SipAdapter {
  let ua: UserAgent | null = null;
  let registerer: Registerer | null = null;
  let session: Session | null = null;
  let callbacks: SipAdapterCallbacks | null = null;
  let muted = false;

  return {
    async register(cfg, cb) {
      callbacks = cb;
      const uri = UserAgent.makeURI(`sip:${cfg.extension}@${cfg.host}`);
      if (!uri) {
        cb.onRegisterFailed('SIP URI が不正です');
        return;
      }
      ua = new UserAgent({
        uri,
        transportOptions: { server: buildWssTransportUrl(cfg.host) },
        authorizationUsername: cfg.extension,
        authorizationPassword: cfg.secret,
        delegate: {
          onInvite(invitation: Invitation) {
            session = invitation;
            const from = invitation.remoteIdentity?.uri?.user ?? '';
            attachRemoteAudio(invitation, audioEl);
            cb.onIncoming(from);
          },
        },
      });
      try {
        await ua.start();
        registerer = new Registerer(ua);
        await registerer.register();
        cb.onRegistered();
      } catch (e) {
        const raw = e instanceof Error ? e.message : String(e);
        cb.onRegisterFailed(classifySipRegisterFailure(raw).userMessage);
      }
    },
    async unregister() {
      try {
        await registerer?.unregister();
        await ua?.stop();
      } catch {
        /* ignore */
      }
      registerer = null;
      ua = null;
      session = null;
    },
    async dial(target) {
      if (!ua) throw new Error('not registered');
      const targetUri = UserAgent.makeURI(`sip:${target}@${ua.configuration.uri?.host ?? 'localhost'}`);
      if (!targetUri) throw new Error('invalid target');
      const inviter = new Inviter(ua, targetUri);
      session = inviter;
      attachRemoteAudio(inviter, audioEl);
      inviter.stateChange.addListener((st) => {
        if (st === SessionState.Established) callbacks?.onInCall();
      });
      await inviter.invite();
      callbacks?.onInCall();
    },
    async answer() {
      const inv = session as Invitation | null;
      if (!inv || !('accept' in inv)) return;
      attachRemoteAudio(inv, audioEl);
      await inv.accept();
      callbacks?.onInCall();
    },
    async hangup() {
      if (!session) return;
      try {
        if (session.state === SessionState.Established) await session.bye();
        else await (session as Invitation).reject?.();
      } catch {
        /* ignore */
      }
      session = null;
      callbacks?.onEnded();
    },
    async sendDtmf(digit) {
      const d = session?.sessionDescriptionHandler;
      if (d && 'sendDtmf' in d && typeof (d as { sendDtmf: (t: string) => void }).sendDtmf === 'function') {
        (d as { sendDtmf: (t: string) => void }).sendDtmf(digit);
      }
    },
    setMuted(m) {
      muted = m;
      const sdh = session?.sessionDescriptionHandler;
      const pc = sdh && 'peerConnection' in sdh ? (sdh as { peerConnection?: RTCPeerConnection }).peerConnection : null;
      if (!pc) return;
      for (const sender of pc.getSenders()) {
        if (sender.track?.kind === 'audio') sender.track.enabled = !muted;
      }
    },
  };
}
