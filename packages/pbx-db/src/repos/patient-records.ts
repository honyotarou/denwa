import type Database from 'better-sqlite3';
import {
  validateCreatePatientRecordInput,
  validateUpdatePatientRecordInput,
  type CreatePatientRecordInput,
  type UpdatePatientRecordInput,
} from '@openpbx/core';
import { ensurePatientExists } from './patients.js';

type RRow = {
  id: number;
  patient_id: string;
  extension: string | null;
  recorded_at: string;
  kind: string;
  summary: string | null;
  note: string | null;
  recommendations_json: string | null;
};

export type PatientRecordRow = Readonly<{
  id: number;
  patientId: string;
  extension: string | null;
  recordedAt: string;
  kind: string;
  summary: string | null;
  note: string | null;
  recommendationsJson: string | null;
}>;

function map(r: RRow): PatientRecordRow {
  return {
    id: r.id,
    patientId: r.patient_id,
    extension: r.extension,
    recordedAt: r.recorded_at,
    kind: r.kind,
    summary: r.summary,
    note: r.note,
    recommendationsJson: r.recommendations_json,
  };
}

export function listPatientRecords(
  db: Database.Database,
  patientId: string,
): PatientRecordRow[] {
  return (
    db
      .prepare(
        `SELECT * FROM patient_records WHERE patient_id = ? ORDER BY recorded_at DESC`,
      )
      .all(patientId) as RRow[]
  ).map(map);
}

export function listRecentPatientRecords(
  db: Database.Database,
  limit = 20,
): PatientRecordRow[] {
  return listRecentPatientRecordsSince(db, 365, limit);
}

export function listRecentPatientRecordsSince(
  db: Database.Database,
  days: number,
  limit = 30,
): PatientRecordRow[] {
  return (
    db
      .prepare(
        `SELECT * FROM patient_records
         WHERE recorded_at >= datetime('now', ?)
         ORDER BY recorded_at DESC LIMIT ?`,
      )
      .all(`-${Math.max(1, days)} days`, limit) as RRow[]
  ).map(map);
}

export function createPatientRecord(
  db: Database.Database,
  input: CreatePatientRecordInput,
): PatientRecordRow {
  const errs = validateCreatePatientRecordInput(input);
  if (errs.length) throw new Error(errs.join('; '));
  ensurePatientExists(db, input.patientId);
  const info = db
    .prepare(
      `INSERT INTO patient_records (patient_id, extension, kind, summary, note, recommendations_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.patientId,
      input.extension ?? null,
      input.kind,
      input.summary ?? null,
      input.note ?? null,
      input.recommendationsJson ?? null,
    );
  const row = db
    .prepare('SELECT * FROM patient_records WHERE id = ?')
    .get(info.lastInsertRowid) as RRow;
  return map(row);
}

export function getPatientRecord(db: Database.Database, id: number): PatientRecordRow | null {
  const row = db.prepare('SELECT * FROM patient_records WHERE id = ?').get(id) as RRow | undefined;
  return row ? map(row) : null;
}

export function updatePatientRecord(
  db: Database.Database,
  input: UpdatePatientRecordInput,
): PatientRecordRow | null {
  const errs = validateUpdatePatientRecordInput(input);
  if (errs.length) throw new Error(errs.join('; '));
  const existing = getPatientRecord(db, input.id);
  if (!existing || existing.patientId !== input.patientId) return null;
  db.prepare(
    `UPDATE patient_records SET extension = ?, kind = ?, summary = ?, note = ?
     WHERE id = ? AND patient_id = ?`,
  ).run(
    input.extension ?? null,
    input.kind,
    input.summary ?? null,
    input.note ?? null,
    input.id,
    input.patientId,
  );
  return getPatientRecord(db, input.id);
}

export function deletePatientRecord(db: Database.Database, id: number): boolean {
  return db.prepare('DELETE FROM patient_records WHERE id = ?').run(id).changes > 0;
}
