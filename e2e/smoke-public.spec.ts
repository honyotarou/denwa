import { test, expect } from '@playwright/test';
import { gotoLogin } from './pages/login';

test.describe('L4 E2E — public', () => {
  test('T-E2E-004: login page returns 200', async ({ page }) => {
    const res = await gotoLogin(page);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible();
  });
});
