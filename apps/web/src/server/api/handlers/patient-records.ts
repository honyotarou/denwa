import { validateCreatePatientRecordInput } from '@openpbx/core';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { createPatientRecordWithAudit } from '../../services/patients';

export async function handlePatientRecordsPost(
  ctx: AppContext,
  body: Record<string, unknown>,
): Promise<JsonHandlerResult> {
  let me;
  try {
    me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  } catch {
    return { status: 401, body: { error: 'unauthorized' } };
  }
  const input = {
    patientId: String(body.patientId ?? ''),
    extension: body.extension != null ? String(body.extension) : null,
    kind: String(body.kind ?? 'note'),
    summary: body.summary != null ? String(body.summary) : null,
    note: body.note != null ? String(body.note) : null,
  };
  const errs = validateCreatePatientRecordInput(input);
  if (errs.length) return { status: 400, body: { error: errs.join('; ') } };
  try {
    const id = createPatientRecordWithAudit(ctx, me, input);
    return { status: 201, body: { ok: true, recordId: id } };
  } catch (e) {
    return { status: 400, body: { error: e instanceof Error ? e.message : 'invalid' } };
  }
}
