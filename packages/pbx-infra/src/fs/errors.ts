export class UnsafePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafePathError';
  }
}

export class InvalidFilenameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFilenameError';
  }
}
