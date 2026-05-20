import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  inspectEntrypointReloadWatcher,
  inspectExtensionsConf,
  inspectHttpConf,
  inspectManagerConf,
  inspectRtpConf,
  rtpRangeMatchesCompose,
} from '../asterisk/conf-inspect.js';
import {
  expectedBuildContexts,
  missingEnvKeys,
  parseComposeBuildContexts,
  WEB_REQUIRED_ENV_KEYS,
} from '../docker/compose-env.js';
import {
  readComposeDraftFromFile,
  allRequiredComposePortsPresent,
} from '../docker/compose-file.js';
import {
  listInboxMetaFiles,
  readInboxMeta,
  runNotifyEventScript,
} from '../inbox/notify-runner.js';
import { buildInboxMeta, INBOX_META_SCHEMA } from '../inbox/meta.js';
import {
  ALL_AUDIT_ACTIONS,
  extractAuditActionsFromSource,
  unknownAuditActions,
} from '../prod/audit-actions.js';
import {
  formatProdCheckReport,
  mergeProdCheckResults,
  prodCheckSecretsReady,
  runProdCheckFiles,
} from '../prod/check.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

function readRepo(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

describe('Phase 8 — runtime & production', () => {
  const draft = () => readComposeDraftFromFile(ROOT);
  const composeText = () => readRepo('docker-compose.yml');

  describe('T-AST-001: extensions _100X MixMonitor', () => {
    it('Given extensions.conf When inspect Then _100X and MixMonitor', () => {
      const r = inspectExtensionsConf(readRepo('asterisk/extensions.conf'));
      expect(r.errors, r.errors.join('\n')).toEqual([]);
    });
  });

  describe('T-AST-002: 9001/9002 Record', () => {
    it('Given extensions.conf When inspect Then 9001/9002 Record flows', () => {
      const text = readRepo('asterisk/extensions.conf');
      expect(text).toMatch(/exten\s*=>\s*9001/i);
      expect(text).toMatch(/exten\s*=>\s*9002/i);
      expect(text).toMatch(/Record\s*\(/);
    });
  });

  describe('T-AST-003: reload watcher', () => {
    it('Given entrypoint.sh When inspect Then pjsip and dialplan reload', () => {
      const r = inspectEntrypointReloadWatcher(readRepo('asterisk/entrypoint.sh'));
      expect(r.ok).toBe(true);
    });
  });

  describe('T-AST-004: 9000 static IVR', () => {
    it('Given extensions.conf When inspect Then 1/2/0 branches', () => {
      const r = inspectExtensionsConf(readRepo('asterisk/extensions.conf'));
      expect(r.ok).toBe(true);
    });
  });

  describe('T-AST-005: dynamic dialplan include', () => {
    it('Given extensions.conf When inspect Then dialplan.d include', () => {
      expect(readRepo('asterisk/extensions.conf')).toContain('#include "dialplan.d/*.conf"');
    });
  });

  describe('T-AST-006: manager.conf AMI', () => {
    it('Given manager.conf When inspect Then user and permit', () => {
      const r = inspectManagerConf(readRepo('asterisk/manager.conf'));
      expect(r.ok).toBe(true);
    });
  });

  describe('T-AST-007: http.conf websocket', () => {
    it('Given http.conf When inspect Then HTTP/TLS enabled', () => {
      const r = inspectHttpConf(readRepo('asterisk/http.conf'));
      expect(r.ok).toBe(true);
    });
  });

  describe('T-AST-008: rtp range vs compose', () => {
    it('Given rtp.conf and compose When inspect Then 10000-10020 mapped', () => {
      const rtp = readRepo('asterisk/rtp.conf');
      expect(inspectRtpConf(rtp).ok).toBe(true);
      expect(rtpRangeMatchesCompose(rtp, draft().services.asterisk?.ports ?? [])).toBe(true);
    });
  });

  describe('T-DOCKER-004: web env keys', () => {
    it('Given compose When parse Then required web env present', () => {
      expect(missingEnvKeys(draft(), 'web', WEB_REQUIRED_ENV_KEYS)).toEqual([]);
    });
  });

  describe('T-DOCKER-005: asterisk INBOX_DIR', () => {
    it('Given compose When parse Then asterisk has INBOX_DIR', () => {
      expect(draft().services.asterisk?.environmentKeys).toContain('INBOX_DIR');
    });
  });

  describe('T-DOCKER-006: build contexts', () => {
    it('Given compose When parse Then asterisk and web Dockerfiles', () => {
      expect(parseComposeBuildContexts(composeText())).toEqual(expectedBuildContexts());
    });
  });

  describe('T-INBOX-001〜006: notify-event.sh', () => {
    const script = path.join(ROOT, 'asterisk/notify-event.sh');
    let inboxDir: string;

    it('creates meta.json (T-INBOX-001)', () => {
      inboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'denwa-inbox-'));
      const wav = path.join(inboxDir, 'rec.wav');
      fs.writeFileSync(wav, 'RIFF');
      runNotifyEventScript({
        scriptPath: script,
        inboxDir,
        kind: 'same_day_reservation',
        extension: '9001',
        callerId: '1001',
        callerName: 'Reception',
        uniqueId: '1700000000.1',
        recordingPath: wav,
      });
      expect(listInboxMetaFiles(inboxDir).length).toBe(1);
    });

    it('copies wav atomically (T-INBOX-002)', () => {
      const meta = listInboxMetaFiles(inboxDir)[0]!;
      const body = readInboxMeta(inboxDir, meta) as { recordingFile: string };
      expect(fs.existsSync(path.join(inboxDir, body.recordingFile))).toBe(true);
      expect(fs.existsSync(path.join(inboxDir, `${body.recordingFile}.tmp`))).toBe(false);
    });

    it('creates meta without wav (T-INBOX-003)', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'denwa-inbox-'));
      runNotifyEventScript({
        scriptPath: script,
        inboxDir: dir,
        kind: 'callback_request',
        extension: '9002',
        callerId: '1002',
        callerName: 'Caller',
        uniqueId: '1700000000.2',
      });
      expect(listInboxMetaFiles(dir).length).toBe(1);
      const body = readInboxMeta(dir, listInboxMetaFiles(dir)[0]!) as { recordingFile: string };
      expect(body.recordingFile).toBe('');
    });

    it('escapes Japanese callerName (T-INBOX-004)', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'denwa-inbox-'));
      runNotifyEventScript({
        scriptPath: script,
        inboxDir: dir,
        kind: 'same_day_reservation',
        extension: '9001',
        callerId: '090',
        callerName: '山田"太郎\\',
        uniqueId: 'u-jp',
      });
      const raw = fs.readFileSync(path.join(dir, listInboxMetaFiles(dir)[0]!), 'utf8');
      expect(() => JSON.parse(raw)).not.toThrow();
      expect(JSON.parse(raw).callerName).toBe('山田"太郎\\');
    });

    it('kind same_day_reservation (T-INBOX-005)', () => {
      const body = readInboxMeta(inboxDir, listInboxMetaFiles(inboxDir)[0]!) as {
        kind: string;
        schema: string;
      };
      expect(body.kind).toBe('same_day_reservation');
      expect(body.schema).toBe(INBOX_META_SCHEMA);
      expect(buildInboxMeta({
        kind: 'same_day_reservation',
        extension: '9001',
        callerId: '1',
        callerName: 'a',
        uniqueId: 'u',
        recordingFile: 'a.wav',
        receivedAt: '2026-01-01T00:00:00Z',
      })).toMatchObject({ kind: 'same_day_reservation' });
    });

    it('kind callback_request (T-INBOX-006)', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'denwa-inbox-'));
      runNotifyEventScript({
        scriptPath: script,
        inboxDir: dir,
        kind: 'callback_request',
        extension: '9002',
        callerId: '1002',
        callerName: 'x',
        uniqueId: 'cb-1',
      });
      const body = readInboxMeta(dir, listInboxMetaFiles(dir)[0]!) as { kind: string };
      expect(body.kind).toBe('callback_request');
    });
  });

  describe('T-PROD-002〜006: repo defaults fail prod file check', () => {
    it('Given repository defaults When prod file check Then fail', () => {
      const r = runProdCheckFiles({ repoRoot: ROOT });
      expect(r.ok).toBe(false);
      expect(r.findings.some((f) => f.id === 'T-PROD-002' && f.severity === 'fail')).toBe(true);
    });
  });

  describe('T-PROD-008: secrets ready only when 001-007 pass', () => {
    it('Given default repo When merge findings Then T-PROD-008 fails', () => {
      const file = runProdCheckFiles({ repoRoot: ROOT });
      const eight = prodCheckSecretsReady(file.findings);
      expect(eight.severity).toBe('fail');
      expect(formatProdCheckReport(mergeProdCheckResults(file, { ok: false, findings: [eight] }))).toContain(
        'T-PROD',
      );
    });
  });

  describe('T-PROD-009: audit action enum', () => {
    it('Given handlers When extract audit actions Then all known', () => {
      const actions = path.join(ROOT, 'apps/web/src/server/actions-handlers.ts');
      const api = path.join(ROOT, 'apps/web/src/server/api-handlers.ts');
      const used = [
        ...extractAuditActionsFromSource(fs.readFileSync(actions, 'utf8')),
        ...extractAuditActionsFromSource(fs.readFileSync(api, 'utf8')),
      ];
      expect(unknownAuditActions(used), used.join(', ')).toEqual([]);
      expect(ALL_AUDIT_ACTIONS.length).toBeGreaterThan(35);
    });
  });

  describe('T-PROD-010 / T-DOC: README contract', () => {
    const readme = () => readRepo('README.md');

    it('T-DOC-001: docker/login/call path documented', () => {
      const t = readme();
      expect(t).toMatch(/docker compose up/i);
      expect(t).toMatch(/ログイン|login/i);
      expect(t).toMatch(/9001|9002|inbox/i);
    });

    it('T-DOC-002: ports match compose', () => {
      const t = readme();
      expect(allRequiredComposePortsPresent(draft())).toEqual([]);
      expect(t).toMatch(/5060/);
      expect(t).toMatch(/3000/);
      expect(t).toMatch(/10000/);
    });

    it('T-DOC-003: security / prod-check documented', () => {
      const t = readme();
      expect(t).toMatch(/prod-check|本番/i);
      expect(t).toMatch(/T-PROD-001|admin password/i);
    });

    it('T-DOC-004: host-tts dev-only note', () => {
      expect(readme()).toMatch(/host-tts|dev-only|開発のみ/i);
    });

    it('T-PROD-010: README lists prod-check checklist items', () => {
      const t = readme();
      expect(t).toMatch(/npm run prod-check/);
      expect(t).toMatch(/admin password|T-PROD-001/i);
      expect(t).toMatch(/AMI|cookie|extension secret/i);
    });
  });
});
