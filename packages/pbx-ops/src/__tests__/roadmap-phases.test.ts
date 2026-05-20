/**
 * docs/TDD-REBUILD-PLAN.md Phase 3〜5, 8〜10 の契約インデックス。
 * 実装の正本は各 package の Vitest。ここは roadmap 行ごとの回帰。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword, validateChromeExtensionManifest } from '@openpbx/core';
import {
  createInMemoryDb,
  createExtension,
  createRingGroup,
  getRingGroup,
  createAccount,
  getCdrRecord,
  runProdCheckDatabase,
  applySchema,
  recordAudit,
  getConcurrencySnapshot,
} from '@openpbx/db';
import {
  writeDialplanFile,
  writePjsipFile,
  signalAsteriskReload,
  parseDeviceStateChangeEvent,
  recordConcurrencySnapshot,
  ingestCdrFile,
} from '@openpbx/infra';
import { readComposeDraftFromFile, listInboxMetaFiles, runNotifyEventScript } from '@openpbx/ops';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const tmpDirs: string[] = [];

function amiFields(block: string): Record<string, string> {
  return Object.fromEntries(
    block
      .split('\r\n')
      .filter(Boolean)
      .map((l) => {
        const i = l.indexOf(':');
        return [l.slice(0, i), l.slice(i + 1).trim()] as const;
      }),
  );
}

async function mkTmp(): Promise<string> {
  const d = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'roadmap-'));
  tmpDirs.push(d);
  return d;
}

afterEach(async () => {
  for (const d of tmpDirs) {
    await fs.promises.rm(d, { recursive: true, force: true });
  }
  tmpDirs.length = 0;
});

describe('Phase 3: DB / リポジトリ', () => {
  it('Given 空 DB When migrate Then extensions テーブルが存在', () => {
    const db = createInMemoryDb();
    expect(
      db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='extensions'`).get(),
    ).toBeTruthy();
  });

  it('Given 内線 When createExtension Then 検証済み行', () => {
    const db = createInMemoryDb();
    createExtension(db, { number: '2001', secret: 'secret-2001', webrtc: true });
    const row = db.prepare('SELECT number, webrtc FROM extensions WHERE number = ?').get('2001') as {
      number: string;
      webrtc: number;
    };
    expect(row.number).toBe('2001');
    expect(row.webrtc).toBe(1);
  });

  it('Given 着信G When createRingGroup Then members priority 順', () => {
    const db = createInMemoryDb();
    createRingGroup(db, { number: '6001', members: ['1002', '1001'] });
    expect(getRingGroup(db, '6001')!.members).toEqual(['1002', '1001']);
  });

  it('Given ユーザー When scrypt hash Then verify でログイン可', () => {
    const stored = hashPassword('roadmap-pw');
    expect(verifyPassword('roadmap-pw', stored)).toBe(true);
    expect(verifyPassword('wrong', stored)).toBe(false);
  });
});

describe('Phase 4: 設定ファイル書き出し', () => {
  it('Given ivr.conf When writeDialplanFile Then 指定 dir のみ', async () => {
    const base = await mkTmp();
    const dial = path.join(base, 'dialplan.d');
    await fs.promises.mkdir(dial, { recursive: true });
    const out = await writeDialplanFile(dial, 'ivr.conf', '; test');
    expect(out).toBe(path.join(dial, 'ivr.conf'));
    expect(fs.existsSync(out)).toBe(true);
  });

  it('Given 不正ファイル名 When writeDialplanFile Then 拒否', async () => {
    const base = await mkTmp();
    const dial = path.join(base, 'dialplan.d');
    await fs.promises.mkdir(dial, { recursive: true });
    await expect(writeDialplanFile(dial, '../evil.conf', 'x')).rejects.toThrow(/invalid dialplan filename/);
  });

  it('Given PJSIP 断片 When write Then reload signal', async () => {
    const base = await mkTmp();
    const pjsip = path.join(base, 'pjsip.d');
    const signals = path.join(base, 'signals');
    await fs.promises.mkdir(pjsip, { recursive: true });
    await writePjsipFile(pjsip, 'extensions.conf', '; ext');
    const stamp = await signalAsteriskReload(signals);
    expect(fs.existsSync(path.join(signals, 'reload'))).toBe(true);
    expect(Number(stamp)).toBeGreaterThan(0);
  });
});

describe('Phase 5: AMI / CDR / 同時通話', () => {
  it('Given DeviceStateChange When parse Then structured event', () => {
    const block = 'Event: DeviceStateChange\r\nDevice: PJSIP/1001\r\nState: Inuse\r\n';
    const ev = parseDeviceStateChangeEvent(amiFields(block));
    expect(ev).toEqual({ device: 'PJSIP/1001', extension: '1001', state: 'inuse' });
  });

  it('Given Master.csv When ingest Then cdr_records', async () => {
    const db = createInMemoryDb();
    const csvPath = path.join(ROOT, 'fixtures/golden/current/cdr/master-row.csv');
    const r = await ingestCdrFile(db, csvPath);
    expect(r.ingested).toBeGreaterThan(0);
    expect(getCdrRecord(db, 'uid-1')).toBeTruthy();
  });

  it('Given 同分 2 回 tick When snapshot Then channels は MAX', () => {
    const db = createInMemoryDb();
    recordConcurrencySnapshot(db, '2026-05-20T10:00', 30);
    recordConcurrencySnapshot(db, '2026-05-20T10:00', 50);
    recordConcurrencySnapshot(db, '2026-05-20T10:00', 10);
    expect(getConcurrencySnapshot(db, '2026-05-20T10:00')).toBe(50);
  });
});

describe('Phase 8: Asterisk / Docker（契約 + manual）', () => {
  it('Given compose When parse Then asterisk service exists', () => {
    const draft = readComposeDraftFromFile(ROOT);
    expect(draft.services.asterisk).toBeDefined();
  });

  it('Given compose When read Then web AMI_HOST asterisk', () => {
    const text = fs.readFileSync(path.join(ROOT, 'docker-compose.yml'), 'utf8');
    expect(text).toMatch(/AMI_HOST:\s*asterisk/);
  });

  it('T-DOC-ROADMAP-008: manual runtime smoke documented', () => {
    const doc = fs.readFileSync(path.join(ROOT, 'docs/ROADMAP-MANUAL.md'), 'utf8');
    expect(doc).toMatch(/5038|docker compose/i);
    expect(doc).toMatch(/SIP REGISTER|着信/i);
  });
});

describe('Phase 9: 周辺連携', () => {
  it('Given notify-event When run Then inbox wav+meta', () => {
    const script = path.join(ROOT, 'asterisk/notify-event.sh');
    const inboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'roadmap-inbox-'));
    const wav = path.join(inboxDir, 'rec.wav');
    fs.writeFileSync(wav, 'RIFF');
    runNotifyEventScript({
      scriptPath: script,
      inboxDir,
      kind: 'same_day_reservation',
      extension: '9001',
      callerId: '1001',
      callerName: 'Test',
      uniqueId: '1700000000.99',
      recordingPath: wav,
    });
    expect(listInboxMetaFiles(inboxDir).length).toBe(1);
    fs.rmSync(inboxDir, { recursive: true, force: true });
  });

  it('Given chrome manifest When validate Then MV3 minimal', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'chrome-extension/manifest.json'), 'utf8'));
    expect(validateChromeExtensionManifest(raw)).toEqual([]);
  });

  it('Given chrome background When read Then Bearer originate', () => {
    const bg = fs.readFileSync(path.join(ROOT, 'chrome-extension/background.js'), 'utf8');
    expect(bg).toMatch(/\/api\/originate/);
    expect(bg).toMatch(/Bearer/);
  });
});

describe('Phase 10: セキュリティ / 運用', () => {
  it('Given デフォルト admin パスワード When prod-check Then 失敗', () => {
    const db = createInMemoryDb();
    applySchema(db);
    db.prepare(
      `INSERT INTO accounts (username, display_name, role, password_hash) VALUES ('admin', 'A', 'admin', ?)`,
    ).run(hashPassword('admin-please-change'));
    expect(runProdCheckDatabase(db).find((f) => f.id === 'T-PROD-001')?.severity).toBe('fail');
  });

  it('Given 監査対象 When recordAudit Then audit_log 行', () => {
    const db = createInMemoryDb();
    recordAudit(db, { actor: 'a1', action: 'extension.create', target: '1001' });
    const row = db.prepare('SELECT action FROM audit_log ORDER BY id DESC LIMIT 1').get() as {
      action: string;
    };
    expect(row.action).toBe('extension.create');
  });
});
