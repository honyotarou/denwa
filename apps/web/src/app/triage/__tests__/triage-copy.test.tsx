/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { CopyButton } from '../triage-flow';

describe('T-TRIAGE-011: copy button', () => {
  afterEach(() => cleanup());

  it('Given click When copy Then shows copied state', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    render(<CopyButton text="summary text" />);
    fireEvent.click(screen.getByRole('button', { name: 'カルテにコピー' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '✓ コピー済' })).toBeTruthy());
    expect(writeText).toHaveBeenCalledWith('summary text');
    vi.unstubAllGlobals();
  });
});
