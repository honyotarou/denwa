import type { UpsertExtensionInput } from '@openpbx/db/repos/extensions';

/** Form field names shared by extensions page and Server Actions (T-FORM-001). */
export const EXTENSION_FORM_FIELDS = [
  'number',
  'displayName',
  'secret',
  'note',
  'webrtc',
] as const;

export type ExtensionFormField = (typeof EXTENSION_FORM_FIELDS)[number];

function fieldString(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function parseExtensionForm(formData: FormData): UpsertExtensionInput {
  return {
    number: fieldString(formData.get('number')),
    displayName: fieldString(formData.get('displayName')) || null,
    secret: fieldString(formData.get('secret')),
    note: fieldString(formData.get('note')) || null,
    webrtc: formData.get('webrtc') === 'on',
  };
}
