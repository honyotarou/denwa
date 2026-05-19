const NAME_RE = /^[A-Za-z0-9_-]{1,32}$/;
const NUMBER_RE = /^[0-9]{2,6}$/;

export type PickupGroupDraft = Readonly<{
  name: string;
  members: readonly string[];
}>;

export function validatePickupGroupDraft(draft: PickupGroupDraft): string[] {
  const errs: string[] = [];
  if (!NAME_RE.test(draft.name)) errs.push('グループ名は英数字 / _ / - のみ、1〜32 文字');
  for (const m of draft.members) {
    if (!NUMBER_RE.test(m)) errs.push(`メンバー番号が不正: ${m}`);
  }
  return errs;
}
