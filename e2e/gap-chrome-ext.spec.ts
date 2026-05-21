import { test, expect } from '@playwright/test';
import { E2E_ADMIN } from './lib/credentials';
import {
  configureExtensionViaOptions,
  launchContextWithExtension,
  openFixtureWithOriginateCapture,
  readClick2CallE2eConfig,
} from './lib/chrome-extension';

async function loginInContext(baseUrl: string, context: Awaited<ReturnType<typeof launchContextWithExtension>>) {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/login`, { waitUntil: 'load' });
  await page.locator('input[name="username"]').fill(E2E_ADMIN.username);
  await page.locator('input[name="password"]').fill(E2E_ADMIN.password);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
  await page.close();
}

test.describe('L5 E2E — G5b Chrome extension', () => {
  test('T-CHX-G5b: tel link sends Bearer originate', async () => {
    const cfg = readClick2CallE2eConfig();
    const context = await launchContextWithExtension();
    try {
      await configureExtensionViaOptions(context, cfg);
      await loginInContext(cfg.baseUrl, context);
      const { page, originatePromise } = await openFixtureWithOriginateCapture(context, cfg);

      await page.locator('a[href^="tel:"]').click();
      const req = await originatePromise;
      expect(req.authorization).toMatch(/^Bearer /);
      expect(req.body).toEqual({ from: '1001', to: '0312345678' });
    } finally {
      await context.close();
    }
  });
});
