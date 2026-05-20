'use server';

import { getRequestContext } from '@/lib/auth';
import {
  createPatientRecordWithAudit,
  deletePatientRecordWithAudit,
  deletePatientWithAudit,
  upsertPatientWithAudit,
} from '@/server/services/patients';
import { flash, formString } from './_flash';

export async function upsertPatientAction(formData: FormData): Promise<void> {
  const id = formString(formData.get('id'));
  await flash(`/patients/${id}`, '患者を保存しました', async () => {
    const ctx = await getRequestContext();
    const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
    upsertPatientWithAudit(ctx, me, {
      id,
      name: formString(formData.get('name')) || null,
      kana: formString(formData.get('kana')) || null,
      birthDate: formString(formData.get('birthDate')) || null,
      phone: formString(formData.get('phone')) || null,
      note: formString(formData.get('note')) || null,
    });
  });
}

export async function deletePatientAction(formData: FormData): Promise<void> {
  await flash('/patients', '患者を削除しました', async () => {
    const ctx = await getRequestContext();
    const me = ctx.auth.requireRole(ctx.sessionToken, ctx.meta, 'supervisor');
    deletePatientWithAudit(ctx, me, formString(formData.get('id')));
  });
}

export async function savePatientRecordAction(formData: FormData): Promise<void> {
  const patientId = formString(formData.get('patientId'));
  await flash(`/patients/${patientId}`, '記録を保存しました', async () => {
    const ctx = await getRequestContext();
    const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
    createPatientRecordWithAudit(ctx, me, {
      patientId,
      extension: formString(formData.get('extension')) || null,
      kind: formString(formData.get('kind')) || 'note',
      summary: formString(formData.get('summary')) || null,
      note: formString(formData.get('note')) || null,
    });
  });
}

export async function deletePatientRecordAction(formData: FormData): Promise<void> {
  const patientId = formString(formData.get('patientId'));
  await flash(`/patients/${patientId}`, '記録を削除しました', async () => {
    const ctx = await getRequestContext();
    const me = ctx.auth.requireRole(ctx.sessionToken, ctx.meta, 'supervisor');
    deletePatientRecordWithAudit(ctx, me, Number(formData.get('recordId')));
  });
}
