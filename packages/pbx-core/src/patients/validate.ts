/** 患者・記録の検証（T-PAT-*）— 単一正本 */

export const PATIENT_RECORD_KINDS = ['triage', 'call', 'note'] as const;
export type PatientRecordKind = (typeof PATIENT_RECORD_KINDS)[number];

const ID_RE = /^\d{5}$/;
const BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/;
const EXT_RE = /^\d{2,6}$/;

export function validatePatientId(id: string): string | null {
  if (!ID_RE.test((id ?? '').trim())) return '患者番号は 5 桁の数字';
  return null;
}

export function validateBirthDate(value: string | null | undefined): string | null {
  if (value == null || !String(value).trim()) return null;
  if (!BIRTH_RE.test(String(value).trim())) return '生年月日は YYYY-MM-DD 形式';
  return null;
}

export function validateRecordKind(kind: string): string | null {
  if (!(PATIENT_RECORD_KINDS as readonly string[]).includes(kind)) {
    return '記録種別が不正です';
  }
  return null;
}

export function validatePatientRecordExtension(ext: string | null | undefined): string | null {
  if (ext == null || !String(ext).trim()) return null;
  if (!EXT_RE.test(String(ext).trim())) return '内線番号の形式が不正です';
  return null;
}

export type UpsertPatientInput = Readonly<{
  id: string;
  name?: string | null;
  kana?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  note?: string | null;
}>;

export function validateUpsertPatientInput(input: UpsertPatientInput): readonly string[] {
  const errs: string[] = [];
  const idErr = validatePatientId(input.id);
  if (idErr) errs.push(idErr);
  const bd = validateBirthDate(input.birthDate);
  if (bd) errs.push(bd);
  return errs;
}

export type CreatePatientRecordInput = Readonly<{
  patientId: string;
  extension?: string | null;
  kind: string;
  summary?: string | null;
  note?: string | null;
  recommendationsJson?: string | null;
}>;

export function validateCreatePatientRecordInput(
  input: CreatePatientRecordInput,
): readonly string[] {
  const errs: string[] = [];
  const idErr = validatePatientId(input.patientId);
  if (idErr) errs.push(idErr);
  const kErr = validateRecordKind(input.kind);
  if (kErr) errs.push(kErr);
  const eErr = validatePatientRecordExtension(input.extension);
  if (eErr) errs.push(eErr);
  return errs;
}

export type UpdatePatientRecordInput = Readonly<{
  id: number;
  patientId: string;
  extension?: string | null;
  kind: string;
  summary?: string | null;
  note?: string | null;
}>;

export function validateUpdatePatientRecordInput(
  input: UpdatePatientRecordInput,
): readonly string[] {
  const errs: string[] = [];
  if (!Number.isFinite(input.id) || input.id < 1) errs.push('記録 ID が不正です');
  const idErr = validatePatientId(input.patientId);
  if (idErr) errs.push(idErr);
  const kErr = validateRecordKind(input.kind);
  if (kErr) errs.push(kErr);
  const eErr = validatePatientRecordExtension(input.extension);
  if (eErr) errs.push(eErr);
  return errs;
}
