import { describe, expect, it } from 'vitest';
import {
  collectEsbuildInstallViolations,
  collectPostcssInstallViolations,
  collectViteInstallViolations,
} from '../prod/sca-install-policy.js';

describe('T-SEC-SCA install pins', () => {
  it('Given next nested postcss 8.4.31 When check Then block', () => {
    expect(
      collectPostcssInstallViolations([
        { name: 'postcss', version: '8.5.10', label: 'root' },
        { name: 'postcss', version: '8.4.31', label: 'next>postcss' },
      ]),
    ).toEqual(['next>postcss: postcss@8.4.31 < 8.5.10']);
  });

  it('Given all postcss 8.5.10 When check Then OK', () => {
    expect(
      collectPostcssInstallViolations([
        { name: 'postcss', version: '8.5.10', label: 'root' },
        { name: 'postcss', version: '8.5.10', label: 'next>postcss' },
      ]),
    ).toEqual([]);
  });

  it('Given vite esbuild 0.21.5 When check Then block', () => {
    expect(
      collectEsbuildInstallViolations([
        { name: 'esbuild', version: '0.28.0', label: 'tsx>esbuild' },
        { name: 'esbuild', version: '0.21.5', label: 'vite>esbuild' },
      ]),
    ).toEqual(['vite>esbuild: esbuild@0.21.5 < 0.24.3']);
  });

  it('Given vite 6.4.2 When check Then OK', () => {
    expect(
      collectViteInstallViolations([{ name: 'vite', version: '6.4.2', label: 'vitest>vite' }]),
    ).toEqual([]);
  });
});
