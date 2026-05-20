export type ProdCheckFinding = Readonly<{
  id: string;
  message: string;
  severity: 'fail' | 'pass';
}>;

export type ProdCheckResult = Readonly<{
  ok: boolean;
  findings: readonly ProdCheckFinding[];
}>;

export function fail(id: string, message: string): ProdCheckFinding {
  return { id, message, severity: 'fail' };
}

export function pass(id: string, message: string): ProdCheckFinding {
  return { id, message, severity: 'pass' };
}
