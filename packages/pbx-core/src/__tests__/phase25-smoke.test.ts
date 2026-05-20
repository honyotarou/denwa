import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkAsteriskConfigTree } from '@openpbx/ops';
import {
  allRequiredComposePortsPresent,
  composeHasServices,
  composeVolumesMatchSection10,
  readComposeDraftFromFile,
} from '@openpbx/ops';
import { normalizeDockerCompose } from '../docker/compose.js';
import type { ExtensionDraftInput } from '../extension.js';
import { normalizeExtensionDraft, toExtensionDraft } from '../extension.js';
import { renderPjsipExtensions } from '../pjsip.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const GOLDEN_COMPOSE = path.join(ROOT, 'fixtures/golden/current/docker/compose-normalized.json');
const GOLDEN_PJSIP_DIR = path.join(ROOT, 'fixtures/golden/current/pjsip');

describe('Phase 2.5 — early runtime smoke', () => {
  const draft = () => readComposeDraftFromFile(ROOT);

  describe('T-DOCKER-001: compose services', () => {
    it('Given docker-compose.yml When parse Then asterisk + web services exist', () => {
      expect(composeHasServices(draft(), ['asterisk', 'web'])).toBe(true);
    });
  });

  describe('T-DOCKER-002: compose ports', () => {
    it('Given docker-compose.yml When parse Then required ports are mapped', () => {
      const missing = allRequiredComposePortsPresent(draft());
      expect(missing, `missing ports: ${missing.join(', ')}`).toEqual([]);
    });
  });

  describe('T-DOCKER-003: compose volumes §10', () => {
    it('Given docker-compose.yml When parse Then §10.2 volume mapping pairs are present', () => {
      const missing = composeVolumesMatchSection10(draft());
      expect(missing, `missing volume pairs: ${missing.join('; ')}`).toEqual([]);
    });
  });

  describe('T-AST-CONFIG-001: minimal asterisk conf', () => {
    it('Given asterisk/ tree When config check Then parse succeeds', () => {
      const result = checkAsteriskConfigTree(path.join(ROOT, 'asterisk'));
      expect(result.errors, result.errors.join('\n')).toEqual([]);
      expect(result.ok).toBe(true);
    });
  });

  describe('T-GM-009: root compose matches golden', () => {
    it('Given repo docker-compose.yml When normalizeDockerCompose Then golden と一致', () => {
      const expected = JSON.parse(fs.readFileSync(GOLDEN_COMPOSE, 'utf8'));
      expect(normalizeDockerCompose(draft())).toEqual(expected);
    });
  });

  describe('T-GM-001: pjsip seed aligns with golden render', () => {
    it('Given golden extension input When renderPjsipExtensions Then golden extensions.conf と一致', () => {
      const input = JSON.parse(
        fs.readFileSync(path.join(GOLDEN_PJSIP_DIR, 'extensions.input.json'), 'utf8'),
      ) as { updatedAt: string; extensions: ExtensionDraftInput[] };
      const expected = fs.readFileSync(path.join(GOLDEN_PJSIP_DIR, 'extensions.conf'), 'utf8');
      const extensions = input.extensions.map((e) => toExtensionDraft(normalizeExtensionDraft(e)));
      const actual = renderPjsipExtensions(extensions, { updatedAt: input.updatedAt });
      expect(actual).toBe(expected);
    });
  });
});
