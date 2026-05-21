/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { SoftphonePanel } from '../app/softphone/softphone-panel';
import type { SipAdapter, SipAdapterCallbacks, SipAdapterConfig } from '../client/softphone/types';

function fakeAdapter(opts?: { failRegister?: boolean; incomingFrom?: string }): SipAdapter {
  let cb: SipAdapterCallbacks | null = null;
  return {
    register: async (_cfg: SipAdapterConfig, callbacks: SipAdapterCallbacks) => {
      cb = callbacks;
      if (opts?.failRegister) {
        callbacks.onRegisterFailed('cert error');
        return;
      }
      callbacks.onRegistered();
      if (opts?.incomingFrom) callbacks.onIncoming(opts.incomingFrom);
    },
    unregister: async () => {},
    dial: async (target: string) => {
      cb?.onInCall();
      void target;
    },
    answer: async () => {
      cb?.onInCall();
    },
    hangup: async () => {
      cb?.onEnded();
    },
    sendDtmf: async () => {},
    setMuted: vi.fn(),
  };
}

describe('SoftphonePanel T-SOFT UI', () => {
  afterEach(() => cleanup());

  it('T-SOFT-014: empty state', () => {
    render(
      <SoftphonePanel profiles={[]} defaultHost="localhost" adapterFactory={(_a) => fakeAdapter()} />,
    );
    expect(screen.getByText(/WebRTC 有効な内線がありません/)).toBeTruthy();
  });

  it('T-SOFT-005/006: register shows registered', async () => {
    render(
      <SoftphonePanel
        profiles={[{ number: '1001', secret: 's' }]}
        defaultHost="localhost"
        adapterFactory={(_a) => fakeAdapter()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'SIP 登録' }));
    await waitFor(() => expect(screen.getByText(/状態: registered/)).toBeTruthy());
  });

  it('T-SOFT-008: dial moves to inCall', async () => {
    render(
      <SoftphonePanel
        profiles={[{ number: '1001', secret: 's' }]}
        defaultHost="localhost"
        adapterFactory={(_a) => fakeAdapter()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'SIP 登録' }));
    fireEvent.change(screen.getByPlaceholderText('発信先'), { target: { value: '1002' } });
    fireEvent.click(screen.getByRole('button', { name: '発信' }));
    await waitFor(() => expect(screen.getByText(/状態: inCall/)).toBeTruthy());
  });

  it('T-SOFT-007: register fail shows classified cert hint', async () => {
    render(
      <SoftphonePanel
        profiles={[{ number: '1001', secret: 's' }]}
        defaultHost="localhost"
        adapterFactory={(_a) => ({
          ...fakeAdapter({ failRegister: true }),
          register: async (_c, cb) => {
            cb.onRegisterFailed('NET::ERR_CERT_AUTHORITY_INVALID');
          },
        })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'SIP 登録' }));
    await waitFor(() => expect(screen.getByText(/TLS 証明書/)).toBeTruthy());
  });

  it('T-SOFT-007b: register fail shows classified message', async () => {
    render(
      <SoftphonePanel
        profiles={[{ number: '1001', secret: 's' }]}
        defaultHost="localhost"
        adapterFactory={(_a) => fakeAdapter({ failRegister: true })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'SIP 登録' }));
    await waitFor(() => expect(screen.getByText(/TLS 証明書/)).toBeTruthy());
  });

  it('T-SOFT-009: incoming shows caller', async () => {
    render(
      <SoftphonePanel
        profiles={[{ number: '1001', secret: 's' }]}
        defaultHost="localhost"
        adapterFactory={(_a) => fakeAdapter({ incomingFrom: '1002' })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'SIP 登録' }));
    await waitFor(() => expect(screen.getByText(/着信 1002/)).toBeTruthy());
  });

  it('T-SOFT-010/011: answer then hangup', async () => {
    render(
      <SoftphonePanel
        profiles={[{ number: '1001', secret: 's' }]}
        defaultHost="localhost"
        adapterFactory={(_a) => fakeAdapter({ incomingFrom: '1002' })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'SIP 登録' }));
    await waitFor(() => expect(screen.getByText(/着信/)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: '応答' }));
    await waitFor(() => expect(screen.getByText(/状態: inCall/)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: '切断' }));
    await waitFor(() => expect(screen.getByText(/状態: registered/)).toBeTruthy());
  });

  it('T-SOFT-012/013: mute and DTMF call adapter', async () => {
    const adapter = fakeAdapter();
    const setMuted = vi.spyOn(adapter, 'setMuted');
    const sendDtmf = vi.spyOn(adapter, 'sendDtmf');
    render(
      <SoftphonePanel
        profiles={[{ number: '1001', secret: 's' }]}
        defaultHost="localhost"
        adapterFactory={(_a) => adapter}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'SIP 登録' }));
    await waitFor(() => expect(screen.getByText(/状態: registered/)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'ミュート' }));
    expect(setMuted).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    expect(sendDtmf).toHaveBeenCalledWith('5');
  });
});
