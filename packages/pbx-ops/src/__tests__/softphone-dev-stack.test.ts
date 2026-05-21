import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assessSoftphoneDevStack } from '../softphone/dev-stack.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('T-SOFT-016 softphone dev stack', () => {
  it('Given repo dev files When assess Then no errors', () => {
    const certsDir = path.join(ROOT, 'asterisk/certs');
    const exists = (p: string) => fs.existsSync(p);
    const errors = assessSoftphoneDevStack({
      certsDir,
      composeOverlayText: fs.readFileSync(
        path.join(ROOT, 'docker-compose.softphone-dev.yml'),
        'utf8',
      ),
      httpDevConfText: fs.readFileSync(path.join(ROOT, 'asterisk/http.dev.conf'), 'utf8'),
      exists,
    });
    if (!exists(path.join(certsDir, 'asterisk.pem'))) {
      expect(errors.some((e) => e.includes('asterisk.pem'))).toBe(true);
      return;
    }
    expect(errors).toEqual([]);
  });
});
