import type { Page } from '@playwright/test';
import { E2E_ADMIN } from '../lib/credentials';

export type LoginCreds = Readonly<{ username: string; password: string }>;

export async function gotoLogin(page: Page) {
  return page.goto('/login');
}

export async function fillLoginForm(page: Page, creds: LoginCreds = E2E_ADMIN): Promise<void> {
  await page.getByRole('textbox', { name: 'ユーザー名' }).fill(creds.username);
  await page.getByLabel('パスワード', { exact: true }).fill(creds.password);
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
