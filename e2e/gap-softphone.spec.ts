import { test, expect } from '@playwright/test';
import net from 'node:net';

test.describe('L4 E2E — softphone dev contract', () => {
  test('T-SOFT-016: /softphone shows WSS endpoint hint', async ({ page }) => {
    await page.goto('/softphone', { waitUntil: 'load' });
    await expect(page.getByText(/wss:\/\/.*:8089\/ws/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/gen-dev-asterisk-certs/i)).toBeVisible();
  });

  test('G4: softphone panel exposes status testid', async ({ page }) => {
    await page.goto('/softphone', { waitUntil: 'load' });
    await expect(page.getByTestId('softphone-status')).toBeVisible();
  });

  test('T-SOFT-019: OpenPBX layout — register row + dial row', async ({ page }) => {
    await page.goto('/softphone', { waitUntil: 'load' });
    await expect(page.getByRole('button', { name: '登録' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: '切断' })).toBeVisible();
    await expect(page.getByRole('button', { name: '発信' })).toBeVisible();
    await expect(page.getByRole('button', { name: '応答' })).toBeVisible();
    await expect(page.getByRole('button', { name: '切る' })).toBeVisible();
    await expect(page.getByPlaceholder(/発信先/)).toBeVisible();
    await expect(page.getByText(/Asterisk ホスト/)).toBeVisible();
    await expect(page.getByText(/状態: 未接続/)).toBeVisible();
  });

  test('T-SOFT-020: DTMF keypad 3x4 grid', async ({ page }) => {
    await page.goto('/softphone', { waitUntil: 'load' });
    for (const d of ['1', '5', '9', '*', '#']) {
      await expect(page.getByRole('button', { name: d, exact: true })).toBeVisible({
        timeout: 30_000,
      });
    }
  });

  test('G4b: WSS 8089 reachable when dev stack up', async () => {
    test.skip(process.env.E2E_WSS_PROBE !== '1', 'set E2E_WSS_PROBE=1 with asterisk dev overlay');
    const ok = await new Promise<boolean>((resolve) => {
      const s = net.connect({ host: '127.0.0.1', port: 8089, timeout: 2000 });
      s.once('connect', () => {
        s.end();
        resolve(true);
      });
      s.once('error', () => resolve(false));
      s.once('timeout', () => {
        s.destroy();
        resolve(false);
      });
    });
    expect(ok).toBe(true);
  });
});
