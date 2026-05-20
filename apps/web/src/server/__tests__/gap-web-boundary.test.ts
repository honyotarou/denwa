import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { hashPassword } from '@openpbx/core';
import { createAccount, listAudit } from '@openpbx/db';
import { createTestContext, loginAsAdmin } from '../context';
import { handlePatientRecordsPost } from '../api/handlers/patient-records';
import { updateNetworkSettingsWithSync } from '../services/network';
import {
  upsertPatientWithAudit,
  deletePatientWithAudit,
  createPatientRecordWithAudit,
} from '../services/patients';

describe('T-NET: network web boundary', () => {
  it('T-NET-010: Given admin When updateNetworkSettingsWithSync Then transport file + audit', async () => {
    const ctx = createTestContext({
      infraDirs: {
        pjsipDir: '/tmp/gap-net/pjsip.d',
        dialplanDir: '/tmp/gap-net/dialplan.d',
        signalDir: '/tmp/gap-net/signals',
        soundsDir: '/tmp/gap-net/sounds',
        recordingsDir: '/tmp/gap-net/recordings',
      },
    });
    fs.mkdirSync(ctx.infraDirs.pjsipDir, { recursive: true });
    ctx.sessionToken = await loginAsAdmin(ctx);
    const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
    await updateNetworkSettingsWithSync(ctx, me, {
      externalIp: '100.64.1.23',
      localNet: '192.168.0.0/16',
    });
    expect(fs.existsSync(path.join(ctx.infraDirs.pjsipDir, 'transports.conf'))).toBe(true);
    expect(listAudit(ctx.db).some((a) => a.action === 'network.update')).toBe(true);
  });

  it('T-NET-011: Given user When requireRole admin for network Then 403', () => {
    const ctx = createTestContext();
    const user = createAccount(ctx.db, {
      username: 'net-user',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.sessionToken = ctx.auth.createSession(user.id, ctx.meta);
    expect(() => ctx.auth.requireRole(ctx.sessionToken!, ctx.meta, 'admin')).toThrow();
  });
});

describe('T-PAT: patient web boundary', () => {
  it('T-PAT-013: Given user When upsertPatientWithAudit Then audit', async () => {
    const ctx = createTestContext();
    const user = createAccount(ctx.db, {
      username: 'pat-user',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.sessionToken = ctx.auth.createSession(user.id, ctx.meta);
    const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
    upsertPatientWithAudit(ctx, me, { id: '12345', name: 'Test' });
    expect(listAudit(ctx.db).some((a) => a.action === 'patient.upsert')).toBe(true);
  });

  it('T-PAT-014: Given user When createPatientRecordWithAudit Then audit', async () => {
    const ctx = createTestContext();
    const user = createAccount(ctx.db, {
      username: 'pat-rec',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.sessionToken = ctx.auth.createSession(user.id, ctx.meta);
    const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
    createPatientRecordWithAudit(ctx, me, { patientId: '12345', kind: 'triage', summary: 's' });
    expect(listAudit(ctx.db).some((a) => a.action === 'patient.record.create')).toBe(true);
  });

  it('T-PAT-015: Given user When requireRole supervisor for delete Then 403', () => {
    const ctx = createTestContext();
    const user = createAccount(ctx.db, {
      username: 'pat-del',
      passwordHash: hashPassword('password12'),
      role: 'user',
    });
    ctx.sessionToken = ctx.auth.createSession(user.id, ctx.meta);
    expect(() => ctx.auth.requireRole(ctx.sessionToken!, ctx.meta, 'supervisor')).toThrow();
  });

  it('T-PAT-016: Given supervisor When deletePatientWithAudit Then ok', async () => {
    const ctx = createTestContext();
    const sup = createAccount(ctx.db, {
      username: 'pat-sup',
      passwordHash: hashPassword('password12'),
      role: 'supervisor',
    });
    ctx.sessionToken = ctx.auth.createSession(sup.id, ctx.meta);
    const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
    upsertPatientWithAudit(ctx, me, { id: '12345' });
    deletePatientWithAudit(ctx, me, '12345');
    expect(listAudit(ctx.db).some((a) => a.action === 'patient.delete')).toBe(true);
  });

  it('T-PAT-017: Given no session When POST records Then 401', async () => {
    const ctx = createTestContext();
    const r = await handlePatientRecordsPost(ctx, { patientId: '12345', kind: 'note' });
    expect(r.status).toBe(401);
  });

  it('T-PAT-018: Given invalid patientId When POST Then 400', async () => {
    const ctx = createTestContext();
    ctx.sessionToken = await loginAsAdmin(ctx);
    const r = await handlePatientRecordsPost(ctx, { patientId: '12', kind: 'note' });
    expect(r.status).toBe(400);
  });

  it('T-PAT-019: Given valid JSON When POST Then 201', async () => {
    const ctx = createTestContext();
    ctx.sessionToken = await loginAsAdmin(ctx);
    const r = await handlePatientRecordsPost(ctx, {
      patientId: '12345',
      kind: 'triage',
      summary: '問診サマリ',
    });
    expect(r.status).toBe(201);
    expect((r.body as { recordId: number }).recordId).toBeGreaterThan(0);
  });
});

describe('T-TRIAGE-010: triage save via API', () => {
  it('Given triage kind When POST patient record Then saved', async () => {
    const ctx = createTestContext();
    ctx.sessionToken = await loginAsAdmin(ctx);
    const r = await handlePatientRecordsPost(ctx, {
      patientId: '54321',
      kind: 'triage',
      summary: '# 問診サマリ',
    });
    expect(r.status).toBe(201);
  });
});
