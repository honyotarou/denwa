#!/usr/bin/env node
/**
 * Chrome 拡張: @openpbx/core をバンドルして background.js / content.js を生成（T-CHX L5 gate）
 */
import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extDir = path.join(ROOT, 'chrome-extension');

const common = {
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome109'],
  logLevel: 'info',
};

await esbuild.build({
  ...common,
  entryPoints: [path.join(extDir, 'src/background-entry.ts')],
  outfile: path.join(extDir, 'background.js'),
  banner: { js: '/** Generated — edit chrome-extension/src/background-entry.ts */\n' },
});

await esbuild.build({
  ...common,
  entryPoints: [path.join(extDir, 'src/content-entry.ts')],
  outfile: path.join(extDir, 'content.js'),
  banner: { js: '/** Generated — edit chrome-extension/src/content-entry.ts */\n' },
});

console.log('[denwa] chrome-extension bundled');
