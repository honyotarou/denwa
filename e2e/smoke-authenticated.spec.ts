import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import {
  gotoExtensions,
  createExtension,
  expectSeededExtensions,
  expectFlashOk,
} from './pages/extensions';
import { e2ePjsipExtensionsConf } from './lib/run-dir';

test.describe('L4 E2E — authenticated', () => {
  test('T-E2E-001: session reaches home summary', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/?$/);
    await expect(page.getByRole('heading', { name: 'PBX 概要' })).toBeVisible({ timeout: 30_000 });
  });

  test('T-E2E-002: extensions lists seeded 1001/1002', async ({ page }) => {
    await gotoExtensions(page);
    await expectSeededExtensions(page);
  });

  test('T-E2E-003: create extension shows flash and syncs pjsip', async ({ page }) => {
    const number = `8${String(Date.now()).slice(-3)}`;
    const secret = 'e2e-secret-12';
    await gotoExtensions(page);
    await createExtension(page, { number, secret, displayName: 'E2E Ext' });
    await expectFlashOk(page, '内線を追加しました');
    await expect(page.getByRole('heading', { name: '登録済み (3)' })).toBeVisible();
    const conf = fs.readFileSync(e2ePjsipExtensionsConf(), 'utf8');
    expect(conf).toContain(number);
  });
});
