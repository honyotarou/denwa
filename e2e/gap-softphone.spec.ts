import { test, expect } from '@playwright/test';

test.describe('L4 E2E — softphone dev contract', () => {
  test('T-SOFT-016: /softphone shows WSS endpoint hint', async ({ page }) => {
    await page.goto('/softphone', { waitUntil: 'load' });
    await expect(page.getByText(/wss:\/\/.*:8089\/ws/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/gen-dev-asterisk-certs/i)).toBeVisible();
  });
});
