import { validateInboxMetaShape } from '@openpbx/core';
import type { InboxMeta } from '@openpbx/core';

/** T-INFRA-014 — 正本は @openpbx/core/inbox/validate-meta */
export function validateInboxMeta(value: unknown): value is InboxMeta {
  return validateInboxMetaShape(value);
}
