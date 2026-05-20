import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findForbiddenTrackedExtensionPasswords,
  FORBIDDEN_TRACKED_EXTENSION_PASSWORDS,
  isForbiddenExtensionSecret,
  isTrackedPjsipExtensionsPlaceholderOnly,
  PJSIP_SYNC_PLACEHOLDER,
} from '../pjsip/tracked-secrets.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('T-SEC-PJSIP-001: tracked extension secrets (F-001 / F-017)', () => {
  it('Given ext-dev password When isForbiddenExtensionSecret Then true', () => {
    expect(isForbiddenExtensionSecret('ext-dev-1001')).toBe(true);
    expect(isForbiddenExtensionSecret('secret-1002')).toBe(true);
  });

  it('Given sync placeholder in DB When isForbiddenExtensionSecret Then true', () => {
    expect(isForbiddenExtensionSecret(PJSIP_SYNC_PLACEHOLDER)).toBe(true);
    expect(findForbiddenTrackedExtensionPasswords(`password=${PJSIP_SYNC_PLACEHOLDER}\n`)).toEqual(
      [],
    );
  });

  it('Given rotated secret When isForbiddenExtensionSecret Then false', () => {
    expect(isForbiddenExtensionSecret('k9R$mRotated-local-only')).toBe(false);
  });

  it('Given tracked pjsip with ext-dev When findForbidden Then hits', () => {
    const ini = '[auth1001](auth-userpass)\npassword=ext-dev-1001\n';
    expect(findForbiddenTrackedExtensionPasswords(ini)).toContain('ext-dev-1001');
  });

  it('Given only placeholder passwords When isTrackedPjsipExtensionsPlaceholderOnly Then true', () => {
    const ini = `password=${PJSIP_SYNC_PLACEHOLDER}\npassword=${PJSIP_SYNC_PLACEHOLDER}\n`;
    expect(isTrackedPjsipExtensionsPlaceholderOnly(ini)).toBe(true);
    expect(findForbiddenTrackedExtensionPasswords(ini)).toEqual([]);
  });

  it('Given repo tracked extensions.conf When no forbidden dev passwords', () => {
    const rel = 'asterisk/pjsip.d/extensions.conf';
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    expect(findForbiddenTrackedExtensionPasswords(text)).toEqual([]);
    expect(isTrackedPjsipExtensionsPlaceholderOnly(text)).toBe(true);
  });

  it('architecture gate loads same forbidden list JSON (parity)', () => {
    const gate = fs.readFileSync(path.join(ROOT, 'scripts/denwa-architecture-gate.mjs'), 'utf8');
    expect(gate).toContain('forbidden-tracked-extension-passwords.json');
    const jsonPath = path.join(ROOT, 'packages/pbx-core/forbidden-tracked-extension-passwords.json');
    const fromJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as string[];
    expect([...fromJson].sort()).toEqual([...FORBIDDEN_TRACKED_EXTENSION_PASSWORDS].sort());
  });
});
