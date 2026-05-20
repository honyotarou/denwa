import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildInboxMeta,
  renderBusinessHoursDialplan,
  renderIvrDialplan,
  renderPickupDialplan,
  renderPjsipExtensions,
  renderRingGroupDialplan,
  renderTrunksDialplan,
  renderTrunksPjsip,
  type ExtensionDraftInput,
  type RingGroupDraft,
  normalizeExtensionDraft,
  toExtensionDraft,
} from '@openpbx/core';
import { createInMemoryDb, getCdrIngestState, getCdrRecord, getConcurrencySnapshot } from '@openpbx/db';
import {
  amiOriginateError,
  amiReconnectDelayMs,
  countActiveChannels,
  createDeviceMap,
  ingestCdrChunk,
  ingestCdrFile,
  isAmiOriginateError,
  isUnsafePathError,
  openRecordingReadStream,
  originateOverSocket,
  parseAmiBlocks,
  parseDeviceStateChangeEvent,
  recordConcurrencySnapshot,
  resolveRecordingPath,
  saveGuidanceWav,
  signalAsteriskReload,
  splitCdrLines,
  validateInboxMeta,
  writeDialplanFile,
  writePjsipFile,
  writeTextAtomic,
} from '../index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const GOLDEN = path.join(ROOT, 'fixtures/golden/current');
const tmpDirs: string[] = [];

async function mkTmp(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pbx-infra-'));
  tmpDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })));
});

describe('Phase 4–5 — @openpbx/infra', () => {
  describe('T-INFRA-001/002/003: writeTextAtomic', () => {
    it('Given safe path When write Then file exists and nested mkdir', async () => {
      const base = await mkTmp();
      const out = await writeTextAtomic(base, 'nested/dir/file.conf', 'hello');
      expect(await fs.readFile(out, 'utf8')).toBe('hello');
    });

    it('Given traversal When write Then error', async () => {
      const base = await mkTmp();
      await expect(writeTextAtomic(base, '../escape.conf', 'x')).rejects.toSatisfy((e) =>
        isUnsafePathError(e),
      );
    });
  });

  describe('T-INFRA-004: signalAsteriskReload', () => {
    it('Given signal dir When signal Then reload file written', async () => {
      const base = await mkTmp();
      const stamp = await signalAsteriskReload(base);
      const body = await fs.readFile(path.join(base, 'reload'), 'utf8');
      expect(body).toBe(stamp);
    });
  });

  describe('T-INFRA-005/006: writePjsipFile', () => {
    it('Given content When writePjsipFile Then only under pjsip.d', async () => {
      const base = await mkTmp();
      const pjsipDir = path.join(base, 'pjsip.d');
      await writePjsipFile(pjsipDir, 'extensions.conf', '; test');
      expect(await fs.readFile(path.join(pjsipDir, 'extensions.conf'), 'utf8')).toBe('; test');
    });

    it('Given golden input When render+write Then matches golden', async () => {
      const base = await mkTmp();
      const input = JSON.parse(
        await fs.readFile(path.join(GOLDEN, 'pjsip/extensions.input.json'), 'utf8'),
      ) as { updatedAt: string; extensions: ExtensionDraftInput[] };
      const extensions = input.extensions.map((e) => toExtensionDraft(normalizeExtensionDraft(e)));
      const expected = await fs.readFile(path.join(GOLDEN, 'pjsip/extensions.conf'), 'utf8');
      const content = renderPjsipExtensions(extensions, { updatedAt: input.updatedAt });
      await writePjsipFile(path.join(base, 'pjsip.d'), 'extensions.conf', content);
      const actual = await fs.readFile(path.join(base, 'pjsip.d', 'extensions.conf'), 'utf8');
      expect(actual).toBe(expected);
    });
  });

  describe('T-INFRA-007: ringgroup dialplan', () => {
    it('Given golden When writeDialplanFile Then matches', async () => {
      const base = await mkTmp();
      const input = JSON.parse(
        await fs.readFile(path.join(GOLDEN, 'dialplan/ringgroups.input.json'), 'utf8'),
      ) as { updatedAt: string; groups: RingGroupDraft[] };
      const expected = await fs.readFile(path.join(GOLDEN, 'dialplan/ringgroups.conf'), 'utf8');
      const content = renderRingGroupDialplan(input.groups, { updatedAt: input.updatedAt });
      await writeDialplanFile(base, 'ringgroups.conf', content);
      expect(await fs.readFile(path.join(base, 'ringgroups.conf'), 'utf8')).toBe(expected);
    });
  });

  describe('T-INFRA-008: pickup dialplan', () => {
    it('Given golden When write Then matches', async () => {
      const base = await mkTmp();
      const input = JSON.parse(await fs.readFile(path.join(GOLDEN, 'dialplan/pickup.input.json'), 'utf8'));
      const expected = await fs.readFile(path.join(GOLDEN, 'dialplan/pickup.conf'), 'utf8');
      const content = renderPickupDialplan({ updatedAt: input.updatedAt });
      await writeDialplanFile(base, 'pickup.conf', content);
      expect(await fs.readFile(path.join(base, 'pickup.conf'), 'utf8')).toBe(expected);
    });
  });

  describe('T-INFRA-009: ivr dialplan', () => {
    it('Given golden When write Then matches', async () => {
      const base = await mkTmp();
      const input = JSON.parse(await fs.readFile(path.join(GOLDEN, 'dialplan/ivr.input.json'), 'utf8'));
      const expected = await fs.readFile(path.join(GOLDEN, 'dialplan/ivr.conf'), 'utf8');
      const content = renderIvrDialplan(input.menus, { updatedAt: input.updatedAt });
      await writeDialplanFile(base, 'ivr.conf', content);
      expect(await fs.readFile(path.join(base, 'ivr.conf'), 'utf8')).toBe(expected);
    });
  });

  describe('T-INFRA-010: trunk configs', () => {
    it('Given golden When write pjsip+dialplan Then both files', async () => {
      const base = await mkTmp();
      const input = JSON.parse(await fs.readFile(path.join(GOLDEN, 'dialplan/trunks.input.json'), 'utf8'));
      const dialExpected = await fs.readFile(path.join(GOLDEN, 'dialplan/trunks.conf'), 'utf8');
      const pjsipContent = renderTrunksPjsip(input.trunks, { updatedAt: input.updatedAt });
      const dialContent = renderTrunksDialplan(input.trunks, { updatedAt: input.updatedAt });
      await writePjsipFile(path.join(base, 'pjsip.d'), 'trunks.conf', pjsipContent);
      await writeDialplanFile(path.join(base, 'dialplan.d'), 'trunks.conf', dialContent);
      expect(await fs.readFile(path.join(base, 'pjsip.d', 'trunks.conf'), 'utf8')).toBe(pjsipContent);
      expect(await fs.readFile(path.join(base, 'dialplan.d', 'trunks.conf'), 'utf8')).toBe(dialExpected);
    });
  });

  describe('T-INFRA-011: business-hours', () => {
    it('Given golden When write Then matches', async () => {
      const base = await mkTmp();
      const input = JSON.parse(
        await fs.readFile(path.join(GOLDEN, 'dialplan/business-hours.input.json'), 'utf8'),
      );
      const expected = await fs.readFile(path.join(GOLDEN, 'dialplan/business-hours.conf'), 'utf8');
      const content = renderBusinessHoursDialplan(input.rules, input.holidays, {
        updatedAt: input.updatedAt,
      });
      await writeDialplanFile(base, 'business-hours.conf', content);
      expect(await fs.readFile(path.join(base, 'business-hours.conf'), 'utf8')).toBe(expected);
    });
  });

  describe('T-INFRA-012: guidance wav', () => {
    it('Given wav bytes When save Then file under sounds', async () => {
      const base = await mkTmp();
      const wav = Buffer.from('RIFFxxxxWAVEfmt ');
      const out = await saveGuidanceWav(base, 'custom/test', wav);
      expect(out).toContain(path.join('custom', 'test.wav'));
    });
  });

  describe('T-INFRA-013: recording traversal', () => {
    it('Given unsafe name When resolve Then error', async () => {
      const base = await mkTmp();
      await expect(() => resolveRecordingPath(base, '../x.wav')).toThrow();
      await expect(() => openRecordingReadStream(base, 'bad')).toThrow();
    });
  });

  describe('T-INFRA-014: inbox meta', () => {
    it('Given meta When validate Then required keys', () => {
      const input = JSON.parse(readFileSync(path.join(GOLDEN, 'inbox/meta.input.json'), 'utf8'));
      const meta = buildInboxMeta(input);
      expect(validateInboxMeta(meta)).toBe(true);
      expect(validateInboxMeta({})).toBe(false);
    });
  });

  describe('T-AMI-001/002: parse AMI', () => {
    it('Given DeviceStateChange block When parse Then extension/state', () => {
      const block = 'Event: DeviceStateChange\r\nDevice: PJSIP/1001\r\nState: Inuse\r\n';
      const fields = parseDeviceStateChangeEvent(
        Object.fromEntries(
          block
            .split('\r\n')
            .filter(Boolean)
            .map((l) => {
              const i = l.indexOf(':');
              return [l.slice(0, i), l.slice(i + 1).trim()] as const;
            }),
        ),
      );
      expect(fields).toEqual({ device: 'PJSIP/1001', extension: '1001', state: 'inuse' });
    });

    it('Given multi-block buffer When parseAmiBlocks Then complete events', () => {
      const buf = 'Event: DeviceStateChange\r\nDevice: PJSIP/1002\r\nState: Ringing\r\n\r\n\r\n';
      const { blocks, remainder } = parseAmiBlocks(buf);
      expect(blocks.length).toBe(1);
      expect(remainder.trim()).toBe('');
      const map = createDeviceMap();
      map.applyBlock(blocks[0]!);
      expect(map.getDevices()[0]!.state).toBe('ringing');
    });
  });

  describe('T-AMI-003: reconnect backoff', () => {
    it('Given retries When delay Then exponential cap', () => {
      expect(amiReconnectDelayMs(0)).toBe(1000);
      expect(amiReconnectDelayMs(5)).toBe(30_000);
      expect(amiReconnectDelayMs(10)).toBe(30_000);
    });
  });

  describe('T-AMI-004: device snapshot', () => {
    it('Given map When getDevices Then snapshot', () => {
      const map = createDeviceMap();
      map.applyBlock('Event: DeviceStateChange\r\nDevice: PJSIP/1001\r\nState: Inuse\r\n');
      expect(map.getDevices()).toHaveLength(1);
    });
  });

  describe('T-AMI-005/006: originate', () => {
    function mockAmiSocket(responses: string[]) {
      let dataHandler: ((c: string) => void) | null = null;
      let step = 0;
      const emitNext = () => {
        const chunk = responses[step++];
        if (chunk && dataHandler) dataHandler(chunk);
      };
      const socket = {
        write() {
          queueMicrotask(emitNext);
        },
        end() {},
        destroy() {},
        on(event: string, handler: (c: string | Error) => void) {
          if (event === 'data') {
            dataHandler = handler as (c: string) => void;
            queueMicrotask(emitNext);
          }
        },
      };
      return socket;
    }

    it('Given mock socket When originate success Then ok', async () => {
      const socket = mockAmiSocket([
        'Asterisk Call Manager/7.0.0\r\n',
        'Response: Success\r\nMessage: Authentication accepted\r\n\r\n',
        'Response: Success\r\n\r\n',
      ]);
      const r = await originateOverSocket(socket, {
        username: 'u',
        secret: 's',
        request: { from: '1001', to: '1002' },
      });
      expect(r.ok).toBe(true);
    });

    it('Given mock socket When originate error Then typed error', async () => {
      const socket = mockAmiSocket([
        'Asterisk Call Manager/7.0.0\r\n',
        'Response: Success\r\nMessage: Authentication accepted\r\n\r\n',
        'Response: Error\r\nMessage: Originate failed\r\n\r\n',
      ]);
      await expect(
        originateOverSocket(socket, {
          username: 'u',
          secret: 's',
          request: { from: '1001', to: '1002' },
        }),
      ).rejects.toSatisfy((e) => isAmiOriginateError(e));
    });
  });

  describe('T-CDR-ING-001/002: cdr ingest', () => {
    it('Given CSV line When ingest Then insert and update', async () => {
      const db = createInMemoryDb();
      const line = await fs.readFile(path.join(GOLDEN, 'cdr/master-row.csv'), 'utf8');
      const r1 = ingestCdrChunk(db, {
        sourcePath: '/tmp/Master.csv',
        inode: 1,
        content: `${line.trim()}\n`,
        startOffset: 0,
      });
      expect(getCdrRecord(db, 'uid-1')!.src).toBe('1001');
      const line2 = line.replace('1001', '1002');
      ingestCdrChunk(db, {
        sourcePath: '/tmp/Master.csv',
        inode: 1,
        content: `${line2.trim()}\n`,
        startOffset: r1.offset,
      });
      expect(getCdrRecord(db, 'uid-1')!.src).toBe('1002');
    });
  });

  describe('T-CDR-ING-003: offset', () => {
    it('Given two chunks When ingest Then only new bytes processed', async () => {
      const db = createInMemoryDb();
      const base = await mkTmp();
      const csv = path.join(base, 'a.csv');
      const line1 = '"","1001","9000","internal","","","","Dial","","t1","t2","t3","60","55","ANSWERED","","","u1"\n';
      const line2 = '"","1002","9000","internal","","","","Dial","","t1","t2","t3","60","55","ANSWERED","","","u2"\n';
      await fs.writeFile(csv, line1 + line2);
      await ingestCdrFile(db, csv);
      expect(getCdrRecord(db, 'u1')).toBeTruthy();
      expect(getCdrRecord(db, 'u2')).toBeTruthy();
      const state = getCdrIngestState(db);
      expect(state.offset).toBeGreaterThan(0);
    });
  });

  describe('T-CDR-ING-004: inode change', () => {
    it('Given new inode When resolve Then offset resets', async () => {
      const db = createInMemoryDb();
      const { resolveIngestOffset, advanceCdrIngestOffset } = await import('@openpbx/db');
      advanceCdrIngestOffset(db, '/f', 1, 500);
      expect(resolveIngestOffset(db, '/f', 2, 1000)).toBe(0);
    });
  });

  describe('T-CDR-ING-005: partial line', () => {
    it('Given incomplete line When split Then remainder kept', () => {
      const { completeLines, remainder } = splitCdrLines('"partial');
      expect(completeLines).toEqual([]);
      expect(remainder).toBe('"partial');
    });
  });

  describe('T-CDR-ING-006: malformed', () => {
    it('Given bad line When ingest Then parseErrors', () => {
      const db = createInMemoryDb();
      const r = ingestCdrChunk(db, {
        sourcePath: '/f',
        inode: 1,
        content: 'not,enough,columns\n',
        startOffset: 0,
      });
      expect(r.parseErrors).toBeGreaterThan(0);
    });
  });

  describe('T-CONC-001/002: concurrency snapshot', () => {
    it('Given same minute When record Then MAX kept', () => {
      const db = createInMemoryDb();
      recordConcurrencySnapshot(db, '2026-05-20T10:00', 30);
      recordConcurrencySnapshot(db, '2026-05-20T10:00', 50);
      expect(getConcurrencySnapshot(db, '2026-05-20T10:00')).toBe(50);
      recordConcurrencySnapshot(db, '2026-05-20T10:00', 10);
      expect(getConcurrencySnapshot(db, '2026-05-20T10:00')).toBe(50);
    });
  });

  describe('T-CONC-003/004: count channels', () => {
    it('Given devices When count Then active only', () => {
      expect(countActiveChannels([{ state: 'inuse' }, { state: 'not_inuse' }])).toBe(1);
      expect(countActiveChannels([])).toBe(0);
    });
  });
});
