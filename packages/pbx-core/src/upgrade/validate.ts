const ISO_PREFIX_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export type UpgradeDraft = Readonly<{
  scheduledAt: string;
  asteriskImage: string;
  webImage?: string | null;
  note?: string | null;
}>;

export function validateUpgradeDraft(draft: UpgradeDraft): string[] {
  const errs: string[] = [];
  if (!ISO_PREFIX_RE.test(draft.scheduledAt)) errs.push('scheduledAt は ISO 形式');
  if (!draft.asteriskImage.trim()) errs.push('asteriskImage は必須');
  return errs;
}
