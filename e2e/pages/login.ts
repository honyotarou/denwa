import type { Page } from '@playwright/test';
import { E2E_ADMIN } from '../lib/credentials';

export type LoginCreds = Readonly<{ username: string; password: string }>;

export async function gotoLogin(page: Page) {
  const res = await page.goto('/login', { waitUntil: 'load' });
  await page.locator('input[name="username"]').waitFor({ state: 'visible', timeout: 30_000 });
  return res;
}

export async function fillLoginForm(page: Page, creds: LoginCreds = E2E_ADMIN): Promise<void> {
  await page.locator('input[name="username"]').fill(creds.username);
  await page.locator('input[name="password"]').fill(creds.password);
}

export async function submitLogin(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'ログイン' }).click();
}

/** Login and wait until session cookie is set (leaves /login). */
export async function loginAsAdmin(page: Page, creds: LoginCreds = E2E_ADMIN): Promise<void> {
  await gotoLogin(page);
  await fillLoginForm(page, creds);
  await submitLogin(page);
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
}
