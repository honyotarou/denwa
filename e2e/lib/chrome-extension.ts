import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type BrowserContext, type Page } from '@playwright/test';

const E2E_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.join(E2E_DIR, '..');

export function chromeExtensionDir(): string {
  return path.join(ROOT, 'chrome-extension');
}

export type Click2CallE2eConfig = Readonly<{
  plain: string;
  from: string;
  baseUrl: string;
}>;

export function readClick2CallE2eConfig(): Click2CallE2eConfig {
  const raw = fs.readFileSync(path.join(E2E_DIR, '.auth/click2call.json'), 'utf8');
  return JSON.parse(raw) as Click2CallE2eConfig;
}

/** MV3 拡張は persistent context + headless:false が必要（Playwright 公式） */
export async function launchContextWithExtension(): Promise<BrowserContext> {
  const ext = chromeExtensionDir();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'denwa-pw-ext-'));
  return chromium.launchPersistentContext(userDataDir, {
    headless: false,
    ignoreDefaultArgs: ['--disable-component-extensions-with-background-pages', '--enable-automation'],
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
}

export async function configureExtensionViaOptions(
  context: BrowserContext,
  cfg: Click2CallE2eConfig,
): Promise<void> {
  const extId = await waitForExtensionId(context, cfg.baseUrl);
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extId}/options.html`);
  await page.locator('#baseUrl').fill(cfg.baseUrl);
  await page.locator('#from').fill(cfg.from);
  await page.locator('#token').fill(cfg.plain);
  await page.locator('#save').click();
  await page.waitForTimeout(200);
  await page.close();
}

async function waitForExtensionId(context: BrowserContext, baseUrl: string): Promise<string> {
  const bootstrap = await context.newPage();
  await bootstrap.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await bootstrap.close();

  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    for (const sw of context.serviceWorkers()) {
      const m = /^chrome-extension:\/\/([a-z]+)\//.exec(sw.url());
      if (m?.[1]) return m[1];
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('extension service worker not found');
}

export async function openFixtureWithOriginateCapture(
  context: BrowserContext,
  cfg: Click2CallE2eConfig,
): Promise<{ page: Page; originatePromise: Promise<{ authorization: string; body: unknown }> }> {
  let resolveOriginate!: (v: { authorization: string; body: unknown }) => void;
  const originatePromise = new Promise<{ authorization: string; body: unknown }>((resolve, reject) => {
    resolveOriginate = resolve;
    setTimeout(() => reject(new Error('originate request timeout')), 20_000);
  });

  await context.route('**/api/originate', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const req = route.request();
    resolveOriginate({
      authorization: req.headers()['authorization'] ?? '',
      body: req.postDataJSON() as unknown,
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  const page = await context.newPage();
  await page.goto(`${cfg.baseUrl}/e2e/click2call-fixture`, { waitUntil: 'load' });
  return { page, originatePromise };
}
