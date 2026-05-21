/** G5b Playwright 拡張起動ポリシー（純関数 / T-CHX-G5b） */

export type ExtensionE2eLaunchEnv = Readonly<{
  ci?: boolean;
  display?: string;
  skipFlag?: boolean;
  platform?: string;
}>;

export type ExtensionE2eLaunchOptions = Readonly<{
  headless: boolean;
  ignoreDefaultArgs: readonly string[];
  extraArgs: readonly string[];
}>;

const IGNORE_PLAYWRIGHT_DEFAULT_ARGS = [
  '--disable-extensions',
  '--disable-component-extensions-with-background-pages',
  '--enable-automation',
] as const;

/** Linux CI 以外（macOS 等）は DISPLAY 無しでも headed 可 */
export function hasExtensionE2eDisplay(env: ExtensionE2eLaunchEnv): boolean {
  if (env.display?.trim()) return true;
  if (!env.ci && env.platform && env.platform !== 'linux') return true;
  return false;
}

/** Linux CI で DISPLAY 無し → skip（xvfb-run 必須） */
export function shouldSkipChromeExtensionE2e(env: ExtensionE2eLaunchEnv): string | null {
  if (env.skipFlag) return 'E2E_SKIP_CHROME_EXT=1';
  if (env.ci && env.platform === 'linux' && !env.display?.trim()) {
    return 'CI without DISPLAY — run harness under xvfb-run';
  }
  return null;
}

export function resolveExtensionE2eLaunch(env: ExtensionE2eLaunchEnv): ExtensionE2eLaunchOptions {
  const headless = !hasExtensionE2eDisplay(env);
  return {
    headless,
    ignoreDefaultArgs: IGNORE_PLAYWRIGHT_DEFAULT_ARGS,
    extraArgs: headless ? ['--headless=new'] : [],
  };
}

export function buildExtensionLoadArgs(extensionDir: string): readonly string[] {
  return [`--disable-extensions-except=${extensionDir}`, `--load-extension=${extensionDir}`];
}
