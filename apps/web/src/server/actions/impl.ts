import {
  normalizeExtensionDraft,
  validateExtensionDraft,
  validateIvrMenuDraft,
  isIpAllowed,
  type IvrMenuDraft,
  type IvrOptionDraft,
} from '@openpbx/core';
import {
  createRingGroup,
  updateRingGroup,
  deleteRingGroup,
  createPickupGroup,
  updatePickupGroup,
  deletePickupGroup,
  createPhonebookEntry,
  updatePhonebookEntry,
  deletePhonebookEntry,
  upsertHoliday,
  deleteHoliday,
  createTimeRule,
  updateTimeRule,
  deleteTimeRule,
  createExtension,
  updateExtension,
  createIvrMenu,
  updateIvrMenu,
  deleteIvrMenu,
  deleteGuidance,
  upsertBillingRate,
  deleteBillingRate,
  upsertSipTrunk,
  deleteSipTrunk,
  scheduleVersionUpgrade,
  deleteVersionUpgrade,
  updatePasswordPolicy,
  DuplicateError,
  NotFoundError,
} from '@openpbx/db';
import type { AppContext } from '../context.js';
import { audit, requireAdmin, requireSupervisor, requireUser, s } from './shared.js';

// T-ACT-001〜003 extensions
export async function createExtensionActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  const note = s(formData.get('note')) || null;
  const draft = normalizeExtensionDraft({
    number: s(formData.get('number')),
    displayName: s(formData.get('displayName')) || null,
    secret: s(formData.get('secret')),
    webrtc: formData.get('webrtc') === 'on',
  });
  if (validateExtensionDraft(draft).length) throw new Error('invalid extension');
  createExtension(ctx.db, {
    number: draft.number,
    displayName: draft.displayName,
    secret: draft.secret,
    note,
    webrtc: draft.webrtc,
  });
  await ctx.infra.syncPjsipExtensions();
  audit(ctx, me, 'extension.create', draft.number);
}

export async function updateExtensionActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  const note = s(formData.get('note')) || null;
  const draft = normalizeExtensionDraft({
    number: s(formData.get('number')),
    displayName: s(formData.get('displayName')) || null,
    secret: s(formData.get('secret')),
    webrtc: formData.get('webrtc') === 'on',
  });
  if (validateExtensionDraft(draft).length) throw new Error('invalid extension');
  updateExtension(ctx.db, {
    number: draft.number,
    displayName: draft.displayName,
    secret: draft.secret,
    note,
    webrtc: draft.webrtc,
  });
  await ctx.infra.syncPjsipExtensions();
  audit(ctx, me, 'extension.update', draft.number);
}

export async function deleteExtensionActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  const number = s(formData.get('number'));
  if (!ctx.infra.extensions.delete(number)) throw new Error('not found');
  await ctx.infra.syncPjsipExtensions();
  audit(ctx, me, 'extension.delete', number);
}

// T-ACT-004〜006 ring groups
export async function createRingGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  createRingGroup(ctx.db, {
    number: s(formData.get('number')),
    name: s(formData.get('name')) || null,
    strategy: (s(formData.get('strategy')) || 'ringall') as 'ringall' | 'linear',
    ringSeconds: Number(s(formData.get('ringSeconds')) || '30'),
    members: s(formData.get('members'))
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  });
  await ctx.infra.syncRingGroups();
  audit(ctx, me, 'ring_group.create', s(formData.get('number')));
}

export async function updateRingGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  updateRingGroup(ctx.db, {
    number: s(formData.get('number')),
    members: s(formData.get('members'))
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  });
  await ctx.infra.syncRingGroups();
  audit(ctx, me, 'ring_group.update', s(formData.get('number')));
}

export async function deleteRingGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  deleteRingGroup(ctx.db, s(formData.get('number')));
  await ctx.infra.syncRingGroups();
  audit(ctx, me, 'ring_group.delete', s(formData.get('number')));
}

// T-ACT-007〜009 pickup
export async function createPickupGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  createPickupGroup(
    ctx.db,
    s(formData.get('name')),
    s(formData.get('members'))
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  );
  await ctx.infra.syncPickup();
  await ctx.infra.syncPjsipExtensions();
  audit(ctx, me, 'pickup.create', s(formData.get('name')));
}

export async function updatePickupGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  updatePickupGroup(
    ctx.db,
    s(formData.get('name')),
    s(formData.get('members'))
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  );
  await ctx.infra.syncPickup();
  audit(ctx, me, 'pickup.update', s(formData.get('name')));
}

export async function deletePickupGroupActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  deletePickupGroup(ctx.db, s(formData.get('name')));
  await ctx.infra.syncPickup();
  audit(ctx, me, 'pickup.delete', s(formData.get('name')));
}

// T-ACT-010〜012 phonebook
export async function createPhonebookActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  createPhonebookEntry(ctx.db, { name: s(formData.get('name')), number: s(formData.get('number')) });
  audit(ctx, me, 'phonebook.create');
}

export async function updatePhonebookActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  updatePhonebookEntry(ctx.db, Number(s(formData.get('id'))), {
    name: s(formData.get('name')),
    number: s(formData.get('number')),
  });
  audit(ctx, me, 'phonebook.update');
}

export async function deletePhonebookActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  deletePhonebookEntry(ctx.db, Number(s(formData.get('id'))));
  audit(ctx, me, 'phonebook.delete');
}

// T-ACT-013〜017 business hours
export async function upsertHolidayActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  upsertHoliday(ctx.db, s(formData.get('date')), s(formData.get('name')));
  await ctx.infra.syncBusinessHours();
  audit(ctx, me, 'holiday.upsert', s(formData.get('date')));
}

export async function deleteHolidayActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  deleteHoliday(ctx.db, s(formData.get('date')));
  await ctx.infra.syncBusinessHours();
  audit(ctx, me, 'holiday.delete', s(formData.get('date')));
}

export async function createTimeRuleActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  createTimeRule(ctx.db, {
    name: s(formData.get('name')),
    days: s(formData.get('days')) || 'mon-fri',
    startTime: s(formData.get('startTime')) || '09:00',
    endTime: s(formData.get('endTime')) || '18:00',
  });
  await ctx.infra.syncBusinessHours();
  audit(ctx, me, 'time_rule.create');
}

export async function updateTimeRuleActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  updateTimeRule(ctx.db, Number(s(formData.get('id'))), {
    name: s(formData.get('name')),
    days: s(formData.get('days')),
    startTime: s(formData.get('startTime')),
    endTime: s(formData.get('endTime')),
  });
  await ctx.infra.syncBusinessHours();
  audit(ctx, me, 'time_rule.update');
}

export async function deleteTimeRuleActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  deleteTimeRule(ctx.db, Number(s(formData.get('id'))));
  await ctx.infra.syncBusinessHours();
  audit(ctx, me, 'time_rule.delete');
}

function parseIvrOptions(formData: FormData): readonly IvrOptionDraft[] {
  const json = s(formData.get('optionsJson'));
  if (json) {
    const parsed = JSON.parse(json) as IvrOptionDraft[];
    return parsed;
  }
  const digit = s(formData.get('digit'));
  const action = s(formData.get('action')) as IvrOptionDraft['action'];
  if (digit && action) {
    return [{ digit, action, target: s(formData.get('target')) || null, label: null }];
  }
  return [];
}

function buildIvrDraftFromForm(formData: FormData): IvrMenuDraft {
  return {
    number: s(formData.get('number')),
    name: s(formData.get('name')) || null,
    welcomePrompt: s(formData.get('welcomePrompt')) || null,
    menuPrompt: s(formData.get('menuPrompt')) || null,
    invalidPrompt: s(formData.get('invalidPrompt')) || null,
    goodbyePrompt: s(formData.get('goodbyePrompt')) || null,
    maxRetries: Number(s(formData.get('maxRetries')) || '3'),
    waitSeconds: Number(s(formData.get('waitSeconds')) || '6'),
    options: parseIvrOptions(formData),
  };
}

// T-ACT-018〜019 IVR
export async function upsertIvrActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  const draft = buildIvrDraftFromForm(formData);
  const errs = validateIvrMenuDraft(draft);
  if (errs.length) throw new Error(errs.join('; '));
  const options = draft.options.map((o) => ({
    digit: o.digit,
    action: o.action,
    target: o.target,
    label: o.label,
  }));
  try {
    createIvrMenu(ctx.db, { number: draft.number, name: draft.name ?? undefined, options });
  } catch (e) {
    if (e instanceof DuplicateError) {
      updateIvrMenu(ctx.db, { number: draft.number, name: draft.name ?? undefined, options });
    } else throw e;
  }
  await ctx.infra.syncIvr();
  audit(ctx, me, 'ivr.upsert', draft.number);
}

export async function deleteIvrActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  const number = s(formData.get('number'));
  deleteIvrMenu(ctx.db, number);
  await ctx.infra.syncIvr();
  audit(ctx, me, 'ivr.delete', number);
}

// T-ACT-020 guidance
export async function deleteGuidanceActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireUser(ctx);
  deleteGuidance(ctx.db, s(formData.get('name')));
  audit(ctx, me, 'guidance.delete', s(formData.get('name')));
}

// T-ACT-021 login
export async function loginActionImpl(
  ctx: AppContext,
  formData: FormData,
): Promise<{ ok: boolean; token?: string; error?: string }> {
  const username = s(formData.get('username'));
  const password = String(formData.get('password') ?? '');
  const allow = ctx.auth.listIpAllow();
  if (!isIpAllowed(ctx.meta.ip, allow)) {
    ctx.auth.recordLoginAttempt(username, false);
    return { ok: false, error: 'IP blocked' };
  }
  const acct = ctx.auth.getAccountByUsername(username);
  const hash = acct ? ctx.auth.getPasswordHash(acct.id) : null;
  if (!acct || !hash || !ctx.auth.verifyPassword(password, hash)) {
    ctx.auth.recordLoginAttempt(username, false);
    ctx.auth.recordAudit({
      actor: username,
      action: 'login.failed',
      ip: ctx.meta.ip,
      userAgent: ctx.meta.userAgent,
    });
    return { ok: false, error: 'invalid credentials' };
  }
  const token = ctx.auth.createSession(acct.id, ctx.meta);
  ctx.auth.recordLoginAttempt(username, true);
  ctx.auth.recordAudit({
    actor: username,
    action: 'login',
    ip: ctx.meta.ip,
    userAgent: ctx.meta.userAgent,
  });
  return { ok: true, token };
}

// T-ACT-022 logout
export async function logoutActionImpl(ctx: AppContext): Promise<void> {
  try {
    const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
    audit(ctx, me, 'logout');
  } catch {
    /* noop */
  }
  if (ctx.sessionToken) ctx.auth.destroySession(ctx.sessionToken);
}

// T-ACT-023〜024 TOTP
export async function setupTotpActionImpl(ctx: AppContext): Promise<void> {
  const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  ctx.auth.setTotpSecret(me.id, ctx.auth.generateTotpSecret());
  audit(ctx, me, 'totp.setup');
}

export async function disableTotpActionImpl(ctx: AppContext): Promise<void> {
  const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  ctx.auth.setTotpSecret(me.id, null);
  audit(ctx, me, 'totp.disable');
}

// T-ACT-025〜026 self
export async function updateMyDisplayNameActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  ctx.auth.updateDisplayName(me.id, s(formData.get('displayName')) || null);
  audit(ctx, me, 'account.self.display_name.update');
}

export async function updateMyPasswordActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = ctx.auth.requireAccount(ctx.sessionToken, ctx.meta);
  const pw = String(formData.get('password') ?? '');
  const errs = ctx.auth.validatePassword(pw);
  if (errs.length) throw new Error(errs.join('; '));
  ctx.auth.setPasswordHash(me.id, ctx.auth.hashPassword(pw));
  audit(ctx, me, 'account.self.password.update');
}

// T-ACT-027〜031 accounts
export async function createAccountActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  ctx.auth.createAccount({
    username: s(formData.get('username')),
    displayName: s(formData.get('displayName')) || undefined,
    passwordHash: ctx.auth.hashPassword(String(formData.get('password') ?? '')),
    role: (s(formData.get('role')) || 'user') as 'user' | 'supervisor' | 'admin',
  });
  audit(ctx, me, 'account.create', s(formData.get('username')));
}

export async function updateAccountRoleActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  const id = Number(s(formData.get('id')));
  const role = s(formData.get('role')) as 'user' | 'supervisor' | 'admin';
  const target = ctx.auth.getAccountById(id);
  if (target?.role === 'admin' && role !== 'admin' && ctx.auth.countAdmins(id) === 0) {
    throw new Error('last admin');
  }
  ctx.auth.updateRole(id, role);
  audit(ctx, me, 'account.role.update', String(id));
}

export async function updateAccountDisplayNameActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  const id = Number(s(formData.get('id')));
  ctx.auth.updateDisplayName(id, s(formData.get('displayName')) || null);
  audit(ctx, me, 'account.display_name.update', String(id));
}

export async function updateAccountPasswordActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  const id = Number(s(formData.get('id')));
  const pw = String(formData.get('password') ?? '');
  const errs = ctx.auth.validatePassword(pw);
  if (errs.length) throw new Error(errs.join('; '));
  ctx.auth.setPasswordHash(id, ctx.auth.hashPassword(pw));
  audit(ctx, me, 'account.password.update', String(id));
}

export async function deleteAccountActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  const id = Number(s(formData.get('id')));
  const target = ctx.auth.getAccountById(id);
  if (target?.role === 'admin' && ctx.auth.countAdmins(id) === 0) throw new Error('last admin');
  if (!ctx.auth.deleteAccount(id)) throw new Error('not found');
  audit(ctx, me, 'account.delete', String(id));
}

// T-ACT-032 policy
export async function updatePolicyActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  updatePasswordPolicy(ctx.db, {
    minLength: Number(s(formData.get('minLength')) || '8'),
    requireDigit: formData.get('requireDigit') === 'on',
  });
  audit(ctx, me, 'policy.update');
}

// T-ACT-033〜034 IP allow
export async function upsertIpAllowActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  const cidr = s(formData.get('cidr'));
  if (!ctx.auth.validateCidr(cidr)) throw new Error('invalid cidr');
  ctx.auth.upsertIpAllow(cidr, s(formData.get('note')) || undefined);
  audit(ctx, me, 'ip_allow.upsert', cidr);
}

export async function deleteIpAllowActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  const cidr = s(formData.get('cidr'));
  if (!ctx.auth.deleteIpAllow(cidr)) throw new Error('not found');
  audit(ctx, me, 'ip_allow.delete', cidr);
}

// T-ACT-035〜036 billing
export async function upsertRateActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireSupervisor(ctx);
  upsertBillingRate(ctx.db, { prefix: s(formData.get('prefix')), perMin: Number(s(formData.get('perMin')) || '0') });
  audit(ctx, me, 'billing_rate.upsert', s(formData.get('prefix')));
}

export async function deleteRateActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireSupervisor(ctx);
  deleteBillingRate(ctx.db, s(formData.get('prefix')));
  audit(ctx, me, 'billing_rate.delete', s(formData.get('prefix')));
}

// T-ACT-037〜038 trunks
export async function upsertTrunkActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  upsertSipTrunk(ctx.db, { name: s(formData.get('name')), host: s(formData.get('host')) });
  await ctx.infra.syncTrunks();
  audit(ctx, me, 'trunk.upsert', s(formData.get('name')));
}

export async function deleteTrunkActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  deleteSipTrunk(ctx.db, s(formData.get('name')));
  await ctx.infra.syncTrunks();
  audit(ctx, me, 'trunk.delete', s(formData.get('name')));
}

// T-ACT-039〜040 upgrades
export async function scheduleUpgradeActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  scheduleVersionUpgrade(ctx.db, {
    scheduledAt: s(formData.get('scheduledAt')),
    asteriskImage: s(formData.get('asteriskImage')),
  });
  audit(ctx, me, 'upgrade.schedule');
}

export async function deleteUpgradeActionImpl(ctx: AppContext, formData: FormData): Promise<void> {
  const me = requireAdmin(ctx);
  deleteVersionUpgrade(ctx.db, Number(s(formData.get('id'))));
  audit(ctx, me, 'upgrade.delete');
}
