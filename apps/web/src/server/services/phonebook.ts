import { normalizePhonebookNumber, validatePhonebookDraft } from '@openpbx/core';
import { createPhonebookEntry, deletePhonebookEntry, updatePhonebookEntry } from '@openpbx/db';
import type { AppContext } from '../context';
import type { SessionAccount } from '../auth';
import { audit } from '../audit';
import { throwIfInvalid } from './validate';

type PhonebookInput = Readonly<{
  name: string;
  number: string;
  category?: string | null;
  note?: string | null;
}>;

function toDbInput(input: PhonebookInput) {
  const number = normalizePhonebookNumber(input.number);
  throwIfInvalid(validatePhonebookDraft({ name: input.name, number }));
  return {
    name: input.name.trim(),
    number,
    category: input.category?.trim() || undefined,
    note: input.note?.trim() || undefined,
  };
}

export function createPhonebookWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  input: PhonebookInput,
): void {
  createPhonebookEntry(ctx.db, toDbInput(input));
  audit(ctx, me, 'phonebook.create');
}

export function updatePhonebookWithAudit(
  ctx: AppContext,
  me: SessionAccount,
  id: number,
  input: PhonebookInput,
): void {
  updatePhonebookEntry(ctx.db, id, toDbInput(input));
  audit(ctx, me, 'phonebook.update');
}

export function deletePhonebookWithAudit(ctx: AppContext, me: SessionAccount, id: number): void {
  deletePhonebookEntry(ctx.db, id);
  audit(ctx, me, 'phonebook.delete');
}
