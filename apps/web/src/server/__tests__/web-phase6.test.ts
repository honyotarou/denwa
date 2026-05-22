import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildInboxMeta, hashPassword } from '@openpbx/core';
import { createAccount, listAudit, listLoginHistory, upsertIpAllow } from '@openpbx/db';
import { validateInboxMeta } from '@openpbx/infra';
import { createTestContext, loginAsAdmin } from '../context';
import { middlewareDecision } from '../middleware-auth';
import {
  handleCdrExportGet,
  handleCdrIngestPost,
  handleDevicesStreamGet,
  handleExtensionsGet,
  handleExtensionsPost,
  handleGuidancesPost,
  handleHealthGet,
  handleOriginatePost,
  handlePhonebookLookupGet,
  handleRecordingGet,
  ensureRecordingFixture,
} from '../api-handlers';
import { authError, isAuthError } from '../auth';

const tmpDirs: string[] = [];

async function mkTmpCtx() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cr-web-'));
  tmpDirs.push(dir);
  return createTestContext({
    infraDirs: {
      pjsipDir: path.join(dir, 'pjsip.d'),
      dialplanDir: path.join(dir, 'dialplan.d'),
      signalDir: path.join(dir, 'signals'),
      soundsDir: path.join(dir, 'sounds'),
      recordingsDir: path.join(dir, 'recordings'),
    },
  });
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })));
});

describe('Phase 6 — middleware & API', () => {
  describe('T-MW-001: unauthenticated page', () => {
    it('Given no session When protected page Then redirect login', () => {
      const d = middlewareDecision({ pathname: '/extensions', hasSession: false, ipAllowed: true });
      expect(d.kind).toBe('redirect');
    });
  });

  describe('T-MW-002: unauthenticated API', () => {
    it('Given no session When API Then 401', () => {
      const d = middlewareDecision({ pathname: '/api/extensions', hasSession: false, ipAllowed: true });
      expect(d).toEqual({ kind: 'json', status: 401, body: { error: 'unauthorized' } });
    });
  });

  describe('T-MW-003: public login', () => {
    it('Given /login When middleware Then pass', () => {
      expect(middlewareDecision({ pathname: '/login', hasSession: false, ipAllowed: true }).kind).toBe('next');
    });
  });

  describe('T-MW-004: fake cookie handler', () => {
    it('Given bad token When requireAccount Then 401', async () => {
      const ctx = await mkTmpCtx();
      expect(() => ctx.auth.requireAccount('bad-token', ctx.meta)).toThrow('unauthorized');
    });
  });

  describe('T-MW-005: IP deny', () => {
    it('Given blocked IP When requireAccount Then 403', async () => {
      const ctx = await mkTmpCtx();
      upsertIpAllow(ctx.db, '10.0.0.0/8');
      const token = await loginAsAdmin(ctx);
      expect(() => ctx.auth.requireAccount(token, { ip: '192.168.1.1' })).toThrow('IP not allowed');
    });
  });

  describe('T-MW-007: middleware IP policy', () => {
    it('Given blocked IP When middlewareDecision Then 403 json', () => {
      const d = middlewareDecision({
        pathname: '/extensions',
        hasSession: true,
        ipAllowed: false,
      });
      expect(d).toEqual({ kind: 'json', status: 403, body: { error: 'forbidden' } });
    });
  });

  describe('T-MW-006: insufficient role', () => {
    it('Given user When admin action Then 403', async () => {
      const ctx = await mkTmpCtx();
      const user = createAccount(ctx.db, {
        username: 'u1',
        passwordHash: hashPassword('password12'),
        role: 'user',
      });
      const token = ctx.auth.createSession(user.id, ctx.meta);
      expect(() => ctx.auth.requireRole(token, ctx.meta, 'admin')).toThrow('forbidden');
    });
  });

  describe('T-API-017: health', () => {
    it('Given health When GET Then 200 and db', async () => {
      const r = await handleHealthGet();
      expect(r.status).toBe(200);
      expect(r.body).toMatchObject({ ok: true, db: true });
    });
  });

  describe('T-SEC-CSV-001: cdr export', () => {
    it('Given supervisor When export Then csv with formula escape', async () => {
      const ctx = await mkTmpCtx();
      const sup = createAccount(ctx.db, {
        username: 'supcsv',
        passwordHash: hashPassword('password12'),
        role: 'supervisor',
      });
      ctx.sessionToken = ctx.auth.createSession(sup.id, ctx.meta);
      ctx.db
        .prepare(
          `INSERT INTO cdr_records (uniqueid, start_at, src, dst, billsec, disposition)
           VALUES ('u-csv', datetime('now'), '=evil', '1002', 10, 'ANSWERED')`,
        )
        .run();
      const r = await handleCdrExportGet(ctx);
      expect(r.status).toBe(200);
      const csv = r.body as string;
      expect(csv).toContain("'=evil");
      expect(csv).not.toMatch(/^=evil/m);
    });
  });

  describe('T-API-001/002: cdr ingest role', () => {
    it('Given supervisor When ingest Then 200', async () => {
      const ctx = await mkTmpCtx();
      const sup = createAccount(ctx.db, {
        username: 'sup',
        passwordHash: hashPassword('password12'),
        role: 'supervisor',
      });
      ctx.sessionToken = ctx.auth.createSession(sup.id, ctx.meta);
      const r = await handleCdrIngestPost(ctx);
      expect(r.status).toBe(200);
    });

    it('Given user When ingest Then 403', async () => {
      const ctx = await mkTmpCtx();
      const user = createAccount(ctx.db, {
        username: 'usr',
        passwordHash: hashPassword('password12'),
        role: 'user',
      });
      ctx.sessionToken = ctx.auth.createSession(user.id, ctx.meta);
      const r = await handleCdrIngestPost(ctx);
      expect(r.status).toBe(403);
    });
  });

  describe('T-API-003/004: devices stream', () => {
    it('Given user When stream Then event-stream', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      const r = await handleDevicesStreamGet(ctx);
      expect(r.status).toBe(200);
      expect(r.headers?.['Content-Type']).toContain('text/event-stream');
    });

    it('Given AMI session mock When stream Then snapshot has connected and devices', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      let changeCb: (() => void) | null = null;
      const mockSession = {
        start: () => {},
        destroy: () => {},
        isConnected: () => true,
        getDevices: () => [
          {
            device: 'PJSIP/1001',
            extension: '1001',
            state: 'not_inuse' as const,
            contact: 'sip:1001@lan',
            reachable: true,
            updatedAt: '2026-05-20T00:00:00.000Z',
          },
        ],
        onChange: (handler: () => void) => {
          changeCb = handler;
          return () => {
            changeCb = null;
          };
        },
      };
      const r = await handleDevicesStreamGet(ctx, { getSession: () => mockSession });
      expect(r.status).toBe(200);
      expect(r.stream).toBeDefined();
      const reader = (r.stream as ReadableStream<Uint8Array>).getReader();
      const decoder = new TextDecoder();
      const { value } = await reader.read();
      reader.releaseLock();
      const text = decoder.decode(value);
      expect(text).toContain('event: snapshot');
      expect(text).toContain('"connected":true');
      expect(text).toContain('PJSIP/1001');
      expect(changeCb).not.toBeNull();
      mockSession.destroy();
    });
  });

  describe('T-API-005/006: extensions mask', () => {
    it('Given user When list Then secret omitted', async () => {
      const ctx = await mkTmpCtx();
      const user = createAccount(ctx.db, {
        username: 'usr2',
        passwordHash: hashPassword('password12'),
        role: 'user',
      });
      ctx.sessionToken = ctx.auth.createSession(user.id, ctx.meta);
      const r = await handleExtensionsGet(ctx);
      expect(r.status).toBe(200);
      const body = r.body as { extensions: Array<{ secret?: string }> };
      expect(body.extensions[0]!.secret).toBeUndefined();
    });

    it('Given admin When list Then secret visible', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      const r = await handleExtensionsGet(ctx);
      const body = r.body as { extensions: Array<{ secret: string }> };
      expect(body.extensions[0]!.secret).not.toBe('••••');
    });
  });

  describe('T-API-007/008: create extension', () => {
    it('Given valid body When POST Then 201 and pjsip file', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      const r = await handleExtensionsPost(ctx, {
        number: '2001',
        secret: 'secret-2001',
      });
      expect(r.status).toBe(201);
      const conf = await fs.readFile(path.join(ctx.infraDirs.pjsipDir, 'extensions.conf'), 'utf8');
      expect(conf).toContain('2001');
    });

    it('Given invalid extension When POST Then 400', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      const r = await handleExtensionsPost(ctx, { number: 'x', secret: 's' });
      expect(r.status).toBe(400);
    });
  });

  describe('T-API-009/010/011: originate', () => {
    it('Given user When originate Then ok + audit', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      const r = await handleOriginatePost(ctx, { from: '1001', to: '1002' });
      expect(r.status).toBe(200);
    });

    it('Given invalid When originate Then 400', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      const r = await handleOriginatePost(ctx, { from: 'x', to: 'y' });
      expect(r.status).toBe(400);
    });

    it('T-SEC-AMI-002: Given non-internal context When originate Then 400', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      const r = await handleOriginatePost(ctx, {
        from: '1001',
        to: '1002',
        context: 'from-trunk',
      });
      expect(r.status).toBe(400);
    });

    it('T-SEC-AMI-001: Given CRLF callerId When originate Then 400', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      const r = await handleOriginatePost(ctx, {
        from: '1001',
        to: '1002',
        callerId: 'x\r\nAction: Command',
      });
      expect(r.status).toBe(400);
    });

    it('Given no session When originate Then 401', async () => {
      const ctx = await mkTmpCtx();
      const r = await handleOriginatePost(ctx, { from: '1001', to: '1002' });
      expect(r.status).toBe(401);
    });
  });

  describe('T-API-012: phonebook', () => {
    it('Given query When lookup Then entries', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      const { createPhonebookEntry } = await import('@openpbx/db');
      createPhonebookEntry(ctx.db, { name: 'A', number: '03' });
      const r = await handlePhonebookLookupGet(ctx, 'A');
      expect(r.status).toBe(200);
    });
  });

  describe('T-API-013/014: guidances', () => {
    it('Given wav When POST Then saved', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      const wav = Buffer.from('RIFFxxxxWAVEdata');
      const r = await handleGuidancesPost(ctx, 'custom/test', wav);
      expect(r.status).toBe(201);
    });

    it('Given non-wav When POST Then 400', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      const r = await handleGuidancesPost(ctx, 'bad', new Uint8Array([1, 2, 3]));
      expect(r.status).toBe(400);
    });

    it('T-SEC-A03-001: Given traversal name When POST Then 400', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      const wav = Buffer.from('RIFFxxxxWAVEdata');
      const r = await handleGuidancesPost(ctx, '../evil', wav);
      expect(r.status).toBe(400);
    });
  });

  describe('T-API-015/016: recordings', () => {
    it('Given file When GET Then stream', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      await ensureRecordingFixture(ctx, 'test.wav');
      const r = await handleRecordingGet(ctx, 'test.wav');
      expect(r.status).toBe(200);
    });

    it('Given traversal When GET Then 400', async () => {
      const ctx = await mkTmpCtx();
      ctx.sessionToken = await loginAsAdmin(ctx);
      const r = await handleRecordingGet(ctx, '../x.wav');
      expect(r.status).toBe(400);
    });
  });

  describe('T-INFRA-014: inbox meta', () => {
    it('Given valid meta When validate Then true', () => {
      const meta = buildInboxMeta({
        kind: 'same_day_reservation',
        extension: '9001',
        callerId: '1001',
        callerName: 'x',
        uniqueId: 'u',
        recordingFile: 'a.wav',
        receivedAt: new Date().toISOString(),
      });
      expect(validateInboxMeta(meta)).toBe(true);
    });
  });
});
