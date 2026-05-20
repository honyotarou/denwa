/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { SoftphonePanel } from '../app/softphone/softphone-panel';
import type { SipAdapter, SipAdapterCallbacks, SipAdapterConfig } from '../client/softphone/types';

function fakeAdapter(): SipAdapter {
  let cb: SipAdapterCallbacks | null = null;
  return {
    register: async (_cfg: SipAdapterConfig, callbacks: SipAdapterCallbacks) => {
      cb = callbacks;
      callbacks.onRegistered();
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
    render(<SoftphonePanel profiles={[]} defaultHost="localhost" adapterFactory={fakeAdapter} />);
    expect(screen.getByText(/WebRTC 有効な内線がありません/)).toBeTruthy();
  });

  it('T-SOFT-005/006: register shows registered', async () => {
    render(
      <SoftphonePanel
        profiles={[{ number: '1001', secret: 's' }]}
        defaultHost="localhost"
        adapterFactory={fakeAdapter}
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
        adapterFactory={fakeAdapter}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'SIP 登録' }));
    fireEvent.change(screen.getByPlaceholderText('発信先'), { target: { value: '1002' } });
    fireEvent.click(screen.getByRole('button', { name: '発信' }));
    await waitFor(() => expect(screen.getByText(/状態: inCall/)).toBeTruthy());
  });
});
