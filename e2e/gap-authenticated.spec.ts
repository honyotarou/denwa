import { test, expect } from '@playwright/test';

test.describe('L4 E2E — OpenPBX gap UI smoke', () => {
  test('T-PAT-021: /patients page sections', async ({ page }) => {
    await page.goto('/patients', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: '患者 / 記録' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /最近の記録/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /患者一覧/ })).toBeVisible();
  });

  test('T-TRIAGE-009: /triage with patient shows save', async ({ page }) => {
    await page.goto('/triage?patient=12345', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: /問診フロー/ })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /患者 12345 に保存/ })).toBeVisible();
  });

  test('T-PAT-023: patient detail has triage link and date-group heading', async ({ page }) => {
    const id = '54321';
    await page.goto('/patients', { waitUntil: 'load' });
    await page.getByPlaceholder('患者番号 5桁').fill(id);
    await page.getByPlaceholder('氏名').fill('Gap E2E');
    await page.getByRole('button', { name: '保存' }).first().click();
    await page.goto(`/patients/${id}`, { waitUntil: 'load' });
    await expect(page.getByRole('link', { name: '問診フロー' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /記録.*日付ごと/ })).toBeVisible();
  });
});
