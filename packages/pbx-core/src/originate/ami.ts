import { ORIGINATE_ALLOWED_CONTEXTS } from '../auth/pbx-api-policy.js';

const EXT_RE = /^[0-9]{2,6}$/;
const AMI_HEADER_SAFE_RE = /^[a-zA-Z0-9._\- ]{0,64}$/;
const AMI_CONTEXT_RE = /^[a-zA-Z0-9_-]{1,32}$/;
const ALLOWED_CONTEXT = new Set<string>(ORIGINATE_ALLOWED_CONTEXTS);

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
  if (req.callerId !== undefined && req.callerId !== '' && !AMI_HEADER_SAFE_RE.test(req.callerId)) {
    errs.push('callerId に使用できない文字があります');
  }
  if (req.context !== undefined && req.context !== '') {
    if (!AMI_CONTEXT_RE.test(req.context)) errs.push('context が不正です');
    else if (!ALLOWED_CONTEXT.has(req.context)) errs.push('context は許可リストのみ');
  }
  return errs;
}

/** legacy originate.ts の AMI Originate フィールド契約 */
export function buildOriginateAction(req: OriginateRequest): Record<string, string> {
  const errs = validateOriginateRequest(req);
  if (errs.length > 0) throw new Error(errs.join('; '));
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
