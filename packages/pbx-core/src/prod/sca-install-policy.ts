/** インストール済み依存の semver 下限（T-SEC-SCA-002/003） */

export const MIN_POSTCSS_VERSION = '8.5.10';
export const MIN_ESBUILD_VERSION = '0.24.3';
export const MIN_VITE_VERSION = '6.4.2';

export type InstalledPackage = Readonly<{
  name: string;
  version: string;
  label: string;
}>;

export function parseSemverTriple(version: string): number {
  const parts = version.replace(/^[^\d]*/, '').split('.').map(Number);
  return parts[0]! * 1_000_000 + (parts[1] ?? 0) * 1000 + (parts[2] ?? 0);
}

export function isSemverAtLeast(version: string, minimum: string): boolean {
  return parseSemverTriple(version) >= parseSemverTriple(minimum);
}

/** postcss インストール位置ごとの下限違反 */
export function collectPostcssInstallViolations(
  packages: readonly InstalledPackage[],
  minimum = MIN_POSTCSS_VERSION,
): readonly string[] {
  return packages
    .filter((p) => p.name === 'postcss' && !isSemverAtLeast(p.version, minimum))
    .map((p) => `${p.label}: postcss@${p.version} < ${minimum}`);
}

/** esbuild インストール位置ごとの下限違反 */
export function collectEsbuildInstallViolations(
  packages: readonly InstalledPackage[],
  minimum = MIN_ESBUILD_VERSION,
): readonly string[] {
  return packages
    .filter((p) => p.name === 'esbuild' && !isSemverAtLeast(p.version, minimum))
    .map((p) => `${p.label}: esbuild@${p.version} < ${minimum}`);
}

/** vite インストール位置ごとの下限違反 */
export function collectViteInstallViolations(
  packages: readonly InstalledPackage[],
  minimum = MIN_VITE_VERSION,
): readonly string[] {
  return packages
    .filter((p) => p.name === 'vite' && !isSemverAtLeast(p.version, minimum))
    .map((p) => `${p.label}: vite@${p.version} < ${minimum}`);
}
