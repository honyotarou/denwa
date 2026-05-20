import type Database from 'better-sqlite3';
import { validateUpsertPatientInput, type UpsertPatientInput } from '@openpbx/core';

type PRow = {
  id: string;
  name: string | null;
  kana: string | null;
  birth_date: string | null;
  phone: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type PatientRow = Readonly<{
  id: string;
  name: string | null;
  kana: string | null;
  birthDate: string | null;
  phone: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}>;

function map(r: PRow): PatientRow {
  return {
    id: r.id,
    name: r.name,
    kana: r.kana,
    birthDate: r.birth_date,
    phone: r.phone,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listPatients(db: Database.Database, query?: string): PatientRow[] {
  if (query?.trim()) {
    const q = `%${query.trim()}%`;
    return (
      db
        .prepare(
          `SELECT * FROM patients WHERE id LIKE ? OR name LIKE ? OR kana LIKE ?
           ORDER BY updated_at DESC LIMIT 200`,
        )
        .all(q, q, q) as PRow[]
    ).map(map);
  }
  return (db.prepare('SELECT * FROM patients ORDER BY updated_at DESC LIMIT 200').all() as PRow[]).map(
    map,
  );
}

export function getPatient(db: Database.Database, id: string): PatientRow | null {
  const r = db.prepare('SELECT * FROM patients WHERE id = ?').get(id) as PRow | undefined;
  return r ? map(r) : null;
}

export function upsertPatient(db: Database.Database, input: UpsertPatientInput): PatientRow {
  const errs = validateUpsertPatientInput(input);
  if (errs.length) throw new Error(errs.join('; '));
  db.prepare(
    `INSERT INTO patients (id, name, kana, birth_date, phone, note, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       kana = excluded.kana,
       birth_date = excluded.birth_date,
       phone = excluded.phone,
       note = excluded.note,
       updated_at = datetime('now')`,
  ).run(
    input.id,
    input.name ?? null,
    input.kana ?? null,
    input.birthDate ?? null,
    input.phone ?? null,
    input.note ?? null,
  );
  return getPatient(db, input.id)!;
}

export function deletePatient(db: Database.Database, id: string): boolean {
  return db.prepare('DELETE FROM patients WHERE id = ?').run(id).changes > 0;
}

export function ensurePatientExists(db: Database.Database, id: string): PatientRow {
  const existing = getPatient(db, id);
  if (existing) return existing;
  return upsertPatient(db, { id });
}
