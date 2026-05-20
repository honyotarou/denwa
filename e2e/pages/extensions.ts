import { expect, type Page } from '@playwright/test';

export async function gotoExtensions(page: Page): Promise<void> {
  await page.goto('/extensions');
  await page.getByRole('heading', { name: '内線端末管理' }).waitFor();
}

/** Seed rows render as input values, not plain text (T-E2E-002). */
export async function expectSeededExtensions(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: '登録済み (2)' })).toBeVisible();
  const numbers = page.locator('section').filter({ hasText: '登録済み' }).getByRole('textbox', { name: '内線番号' });
  await expect(numbers.nth(0)).toHaveValue('1001');
  await expect(numbers.nth(1)).toHaveValue('1002');
}

/** Server Action redirect contract (`_flash.ts`); client FlashBanner is best-effort. */
export async function expectFlashOk(page: Page, message: string): Promise<void> {
  await page.waitForURL((url) => url.searchParams.get('ok') === message, { timeout: 15_000 });
}

/** First "新規追加" form on /extensions. */
export function newExtensionForm(page: Page) {
  const section = page.getByRole('heading', { name: '新規追加' }).locator('..');
  return section.locator('form').first();
}

export async function createExtension(
  page: Page,
  input: Readonly<{ number: string; secret: string; displayName?: string }>,
): Promise<void> {
  const form = newExtensionForm(page);
  await form.getByLabel('内線番号').fill(input.number);
  if (input.displayName) {
    await form.getByLabel('表示名').fill(input.displayName);
  }
  await form.getByLabel('パスワード (secret)').fill(input.secret);
  await form.getByRole('button', { name: '追加' }).click();
}
