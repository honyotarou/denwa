import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type ExtensionNumber,
  type IvrNumber,
  parseExtensionNumber,
  parseIvrNumber,
  parseUsername,
  type Username,
} from '../brands.js';
import type { ExtensionDraft, ExtensionDraftInput } from '../extension.js';

describe('T-TS-001: Branded Type distinguishes value objects', () => {
  it('Given valid digits When parseExtensionNumber Then branded', () => {
    expect(parseExtensionNumber('9001')).toBe('9001');
  });

  it('Given invalid When parseExtensionNumber Then null', () => {
    expect(parseExtensionNumber('1')).toBeNull();
  });

  it('Given ExtensionNumber and IvrNumber When type-level Then not interchangeable', () => {
    expectTypeOf<ExtensionNumber>().not.toEqualTypeOf<IvrNumber>();
    expectTypeOf<ExtensionNumber>().not.toMatchTypeOf<IvrNumber>();
  });
});

describe('T-TS-002: Readonly draft types + boundary input', () => {
  it('Given ExtensionDraft When type-level Then Readonly and branded number', () => {
    expectTypeOf<ExtensionDraft>().toMatchTypeOf<Readonly<{ number: ExtensionNumber }>>();
    expectTypeOf<ExtensionDraftInput['number']>().toEqualTypeOf<string>();
  });

  it('Given ExtensionDraftInput When assign Then plain string number allowed', () => {
    const input: ExtensionDraftInput = { number: '1001', secret: 'x' };
    expect(input.number).toBe('1001');
  });
});

describe('T-TS-002: Username brand', () => {
  it('Given valid username When parseUsername Then branded', () => {
    const u = parseUsername('admin');
    expect(u).toBe('admin');
    expectTypeOf(u).toEqualTypeOf<Username | null>();
  });

  it('Given empty When parseUsername Then null', () => {
    expect(parseUsername('')).toBeNull();
  });
});
