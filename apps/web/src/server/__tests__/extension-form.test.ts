import { describe, expect, it } from 'vitest';
import {
  EXTENSION_FORM_FIELDS,
  parseExtensionForm,
} from '../actions/forms/extension-form';

describe('T-FORM-001: extension form adapter', () => {
  it('Given EXTENSION_FORM_FIELDS When page inputs Then keys align', () => {
    expect(EXTENSION_FORM_FIELDS).toContain('number');
    expect(EXTENSION_FORM_FIELDS).toContain('secret');
    expect(EXTENSION_FORM_FIELDS).toHaveLength(5);
  });

  it('Given FormData When parseExtensionForm Then UpsertExtensionInput', () => {
    const fd = new FormData();
    fd.set('number', '9001');
    fd.set('displayName', 'Desk');
    fd.set('secret', 's3cret12');
    fd.set('note', 'n');
    fd.set('webrtc', 'on');
    expect(parseExtensionForm(fd)).toEqual({
      number: '9001',
      displayName: 'Desk',
      secret: 's3cret12',
      note: 'n',
      webrtc: true,
    });
  });

  it('Given empty optional fields When parse Then nulls and webrtc false', () => {
    const fd = new FormData();
    fd.set('number', '9002');
    fd.set('secret', 'x');
    expect(parseExtensionForm(fd)).toMatchObject({
      number: '9002',
      displayName: null,
      note: null,
      webrtc: false,
    });
  });
});
