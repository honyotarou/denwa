import { test as setup } from '@playwright/test';
import { loginAsAdmin } from './pages/login';
import { ADMIN_STORAGE } from './lib/storage';

setup('authenticate admin', async ({ page }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: ADMIN_STORAGE });
});
