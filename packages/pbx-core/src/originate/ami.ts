const EXT_RE = /^[0-9]{2,6}$/;

export type OriginateRequest = Readonly<{
  from: string;
  to: string;
  callerId?: string;
  context?: string;
}>;

export function validateOriginateRequest(req: OriginateRequest): string[] {
  const errs: string[] = [];
  if (!EXT_RE.test(req.from)) errs.push('from は 2〜6 桁の内線');
  if (!EXT_RE.test(req.to)) errs.push('to は 2〜6 桁');
  return errs;
}

/** legacy originate.ts の AMI Originate フィールド契約 */
export function buildOriginateAction(req: OriginateRequest): Record<string, string> {
  return {
    Action: 'Originate',
    Channel: `PJSIP/${req.from}`,
    Context: req.context ?? 'internal',
    Exten: req.to,
    Priority: '1',
    Timeout: '30000',
    CallerID: req.callerId ?? `Click <${req.from}>`,
    Async: 'true',
  };
}
