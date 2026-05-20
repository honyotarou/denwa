import { describe, expect, it } from 'vitest';
import { createInMemoryDb } from '../index.js';
import {
  createPatientRecord,
  listPatientRecords,
  listRecentPatientRecords,
} from '../repos/patient-records.js';
import { deletePatient, listPatients, upsertPatient, getPatient } from '../repos/patients.js';
import { getNetworkSettings, updateNetworkSettings } from '../repos/network-settings.js';

describe('T-PAT: patient repos', () => {
  it('T-PAT-007: Given empty db When applySchema Then patients tables exist', () => {
    const db = createInMemoryDb();
    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('patients','patient_records')`)
      .all() as Array<{ name: string }>;
    expect(tables.map((t) => t.name).sort()).toEqual(['patient_records', 'patients']);
  });

  it('T-PAT-008: Given upsert twice When get Then updated fields preserved created_at', () => {
    const db = createInMemoryDb();
    const a = upsertPatient(db, { id: '12345', name: 'A' });
    const b = upsertPatient(db, { id: '12345', name: 'B', kana: 'カナ' });
    expect(b.name).toBe('B');
    expect(b.kana).toBe('カナ');
    expect(b.createdAt).toBe(a.createdAt);
  });

  it('T-PAT-009: Given kana search When listPatients Then match', () => {
    const db = createInMemoryDb();
    upsertPatient(db, { id: '11111', kana: 'ヤマダ' });
    upsertPatient(db, { id: '22222', kana: 'サトウ' });
    expect(listPatients(db, 'ヤマ').map((p) => p.id)).toEqual(['11111']);
  });

  it('T-PAT-010: Given missing patient When createPatientRecord Then auto-create', () => {
    const db = createInMemoryDb();
    createPatientRecord(db, { patientId: '99999', kind: 'note', summary: 'x' });
    expect(getPatient(db, '99999')).not.toBeNull();
  });

  it('T-PAT-011: Given patient with records When deletePatient Then cascade', () => {
    const db = createInMemoryDb();
    upsertPatient(db, { id: '12345' });
    createPatientRecord(db, { patientId: '12345', kind: 'note' });
    deletePatient(db, '12345');
    expect(getPatient(db, '12345')).toBeNull();
    expect(listPatientRecords(db, '12345')).toEqual([]);
  });

  it('T-PAT-012: Given records When listRecent Then desc by recorded_at', () => {
    const db = createInMemoryDb();
    upsertPatient(db, { id: '12345' });
    createPatientRecord(db, { patientId: '12345', kind: 'note', summary: 'a' });
    const rows = listRecentPatientRecords(db, 5);
    expect(rows[0]?.patientId).toBe('12345');
  });
});

describe('T-NET: network_settings repo', () => {
  it('T-NET-008: Given empty db When applySchema Then network_settings row', () => {
    const db = createInMemoryDb();
    const row = db.prepare('SELECT id FROM network_settings WHERE id = 1').get() as { id: number };
    expect(row.id).toBe(1);
  });

  it('T-NET-009: Given update When get Then normalized', () => {
    const db = createInMemoryDb();
    const row = updateNetworkSettings(db, {
      externalIp: '100.64.1.23',
      externalSignalingIp: '',
      localNet: ' 192.168.0.0/16 , 100.64.0.0/10 ',
    });
    expect(row.externalIp).toBe('100.64.1.23');
    expect(row.externalSignalingIp).toBe('100.64.1.23');
    expect(row.localNet).toBe('100.64.0.0/10,192.168.0.0/16');
    expect(getNetworkSettings(db).externalIp).toBe('100.64.1.23');
  });
});
