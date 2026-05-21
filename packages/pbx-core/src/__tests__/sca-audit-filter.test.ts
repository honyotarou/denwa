import { describe, expect, it } from 'vitest';
import { collectBlockedAdvisories } from '../prod/sca-audit-filter.js';

describe('T-SEC-SCA-002 strict audit filter', () => {
  it('Given next>postcss moderate When filter Then block', () => {
    expect(
      collectBlockedAdvisories([
        { name: 'next', severity: 'moderate', via: ['postcss'] },
        { name: 'postcss', severity: 'moderate', via: ['postcss'] },
      ]),
    ).toHaveLength(2);
  });

  it('Given esbuild moderate When filter Then block', () => {
    expect(
      collectBlockedAdvisories([{ name: 'esbuild', severity: 'moderate', via: ['esbuild'] }]),
    ).toEqual(['esbuild (moderate) via esbuild']);
  });

  it('Given no moderate+ When filter Then OK', () => {
    expect(collectBlockedAdvisories([])).toEqual([]);
  });
});
