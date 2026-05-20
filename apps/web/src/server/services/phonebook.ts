import { normalizePhonebookNumber, validatePhonebookDraft } from '@openpbx/core';
import { createPhonebookEntry, deletePhonebookEntry, updatePhonebookEntry } from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../actions/shared';
import { throwIfInvalid } from './validate';

export function createPhonebookWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  input: { name: string; number: string },
): void {
  const number = normalizePhonebookNumber(input.number);
  throwIfInvalid(validatePhonebookDraft({ name: input.name, number }));
  createPhonebookEntry(ctx.db, { name: input.name.trim(), number });
  audit(ctx, me, 'phonebook.create');
}

export function updatePhonebookWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  id: number,
  input: { name: string; number: string },
): void {
  const number = normalizePhonebookNumber(input.number);
  throwIfInvalid(validatePhonebookDraft({ name: input.name, number }));
  updatePhonebookEntry(ctx.db, id, { name: input.name.trim(), number });
  audit(ctx, me, 'phonebook.update');
}

export function deletePhonebookWithAudit(ctx: AppContext, me: SessionAccount, id: number): void {
  deletePhonebookEntry(ctx.db, id);
  audit(ctx, me, 'phonebook.delete');
}
