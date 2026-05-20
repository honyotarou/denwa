/** Barrel: pages may import from `@/app/actions` or domain `@/app/actions/<domain>`. */
/** 各 `./actions/*` に `'use server'` があるため、このファイルには付けない（Next の export * 制約）。 */
export * from './actions/auth';
export * from './actions/extensions';
export * from './actions/ring-groups';
export * from './actions/pickup';
export * from './actions/phonebook';
export * from './actions/business-hours';
export * from './actions/ivr';
export * from './actions/guidance';
export * from './actions/me';
export * from './actions/accounts';
export * from './actions/admin';
export * from './actions/network';
export * from './actions/patients';
export * from './actions/click-to-call';
export * from './actions/extension-grants';
