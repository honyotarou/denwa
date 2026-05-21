import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const BG = path.join(ROOT, 'chrome-extension/background.js');
const CT = path.join(ROOT, 'chrome-extension/content.js');

describe('T-CHX L5 chrome-extension bundle', () => {
  it('background.js is generated and calls /api/originate with Bearer', () => {
    const t = fs.readFileSync(BG, 'utf8');
    expect(t).toContain('Generated');
    expect(t).toMatch(/\/api\/originate/);
    expect(t).toContain('Bearer');
  });

  it('content.js decorates tel links', () => {
    const t = fs.readFileSync(CT, 'utf8');
    expect(t).toContain('tel:');
    expect(t).toMatch(/originate|sendMessage/);
  });
});
