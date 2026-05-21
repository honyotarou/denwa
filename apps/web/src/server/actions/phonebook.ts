import type { AppContext } from '../context.js';
import { requireUser, s } from './shared.js';
import {
  createPhonebookWithAudit,
  deletePhonebookWithAudit,
  updatePhonebookWithAudit,
} from '../services/phonebook';

function phonebookFields(formData: FormData) {
  return {
    name: s(formData.get('name')),
    number: s(formData.get('number')),
    category: s(formData.get('category')) || null,
    note: s(formData.get('note')) || null,
  };
}

export async function createPhonebookActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  createPhonebookWithAudit(ctx, me, phonebookFields(formData));
}

export async function updatePhonebookActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  updatePhonebookWithAudit(ctx, me, Number(s(formData.get('id'))), phonebookFields(formData));
}

export async function deletePhonebookActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  deletePhonebookWithAudit(ctx, me, Number(s(formData.get('id'))));
}
