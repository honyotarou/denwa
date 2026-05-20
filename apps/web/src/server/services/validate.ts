/** Throw when @openpbx/core validation returns errors. */
export function throwIfInvalid(errs: readonly string[]): void {
  if (errs.length) throw new Error(errs.join('; '));
}

export function throwIfInvalidField(msg: string | null): void {
  if (msg) throw new Error(msg);
}
