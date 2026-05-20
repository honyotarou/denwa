/** §2.5 Server Actions 監査 action 名 + API 由来（T-PROD-009） */

export const SERVER_ACTION_AUDIT_ACTIONS = [
  'extension.create',
  'extension.update',
  'extension.delete',
  'ring_group.create',
  'ring_group.update',
  'ring_group.delete',
  'pickup.create',
  'pickup.update',
  'pickup.delete',
  'phonebook.create',
  'phonebook.update',
  'phonebook.delete',
  'holiday.upsert',
  'holiday.delete',
  'time_rule.create',
  'time_rule.update',
  'time_rule.delete',
  'ivr.upsert',
  'ivr.delete',
  'guidance.delete',
  'login',
  'login.failed',
  'login.failed.totp',
  'logout',
  'totp.setup',
  'totp.disable',
  'account.self.display_name.update',
  'account.self.password.update',
  'account.create',
  'account.role.update',
  'account.display_name.update',
  'account.password.update',
  'account.delete',
  'policy.update',
  'ip_allow.upsert',
  'ip_allow.delete',
  'billing_rate.upsert',
  'billing_rate.delete',
  'trunk.upsert',
  'trunk.delete',
  'upgrade.schedule',
  'upgrade.delete',
  'upgrade.due',
  'network.update',
  'patient.upsert',
  'patient.delete',
  'patient.record.create',
  'patient.record.delete',
  'click2call.token.create',
  'click2call.token.revoke',
  'extension.grant',
  'extension.grant.revoke',
] as const;

export const API_AUDIT_ACTIONS = [
  'click2call',
  'recording.read',
  'phonebook.lookup',
  'devices.stream',
] as const;

export const ALL_AUDIT_ACTIONS = [...SERVER_ACTION_AUDIT_ACTIONS, ...API_AUDIT_ACTIONS] as const;

export type AuditAction = (typeof ALL_AUDIT_ACTIONS)[number];

const SET = new Set<string>(ALL_AUDIT_ACTIONS);

export function isKnownAuditAction(action: string): action is AuditAction {
  return SET.has(action);
}

/** 監査ログ用 action のみ抽出（IVR option の `action:` は含めない） */
export function extractAuditActionsFromSource(source: string): readonly string[] {
  const found = new Set<string>();
  for (const m of source.matchAll(/audit\([^,]+,[^,]+,\s*['"]([^'"]+)['"]/g)) {
    found.add(m[1]!);
  }
  for (const block of source.matchAll(/(?:ctx\.auth\.)?recordAudit\(\{([\s\S]*?)\}\s*\)/g)) {
    for (const m of block[1]!.matchAll(/action:\s*['"]([^'"]+)['"]/g)) {
      found.add(m[1]!);
    }
  }
  return [...found].sort();
}

export function unknownAuditActions(actions: readonly string[]): readonly string[] {
  return actions.filter((a) => !isKnownAuditAction(a));
}
