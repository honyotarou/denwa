import type {
  CreatePatientRecordInput,
  UpdatePatientRecordInput,
  UpsertPatientInput,
} from '@openpbx/core';
import {
  createPatientRecord,
  deletePatient,
  deletePatientRecord,
  updatePatientRecord,
  upsertPatient,
} from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit';

export function upsertPatientWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  input: UpsertPatientInput,
): void {
  upsertPatient(ctx.db, input);
  audit(ctx, me, 'patient.upsert', input.id);
}

export function deletePatientWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  id: string,
): void {
  deletePatient(ctx.db, id);
  audit(ctx, me, 'patient.delete', id);
}

export function createPatientRecordWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  input: CreatePatientRecordInput,
): number {
  const row = createPatientRecord(ctx.db, input);
  audit(ctx, me, 'patient.record.create', `${input.patientId}:${row.id}`);
  return row.id;
}

export function deletePatientRecordWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  id: number,
): void {
  deletePatientRecord(ctx.db, id);
  audit(ctx, me, 'patient.record.delete', String(id));
}

export function updatePatientRecordWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  input: UpdatePatientRecordInput,
): void {
  const row = updatePatientRecord(ctx.db, input);
  if (!row) throw new Error('記録が見つかりません');
  audit(ctx, me, 'patient.record.update', `${input.patientId}:${input.id}`);
}
