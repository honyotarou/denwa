import type { PasswordPolicy } from './policy.js';

/** DB `password_policies` 行の UI / 永続化用 */
export type PasswordPolicySettings = Readonly<
  PasswordPolicy & {
    rotationDays: number;
    lockoutThreshold: number;
  }
>;

export function toPasswordPolicy(settings: PasswordPolicySettings): PasswordPolicy {
  return {
    minLength: settings.minLength,
    requireLowercase: settings.requireLowercase,
    requireUppercase: settings.requireUppercase,
    requireDigit: settings.requireDigit,
    requireSymbol: settings.requireSymbol,
  };
}

export function parsePasswordPolicyForm(input: {
  minLength: number;
  requireLowercase: boolean;
  requireUppercase: boolean;
  requireDigit: boolean;
  requireSymbol: boolean;
  rotationDays: number;
  lockoutThreshold: number;
}): PasswordPolicySettings {
  return {
    minLength: Math.min(64, Math.max(4, input.minLength)),
    requireLowercase: input.requireLowercase,
    requireUppercase: input.requireUppercase,
    requireDigit: input.requireDigit,
    requireSymbol: input.requireSymbol,
    rotationDays: Math.max(0, input.rotationDays),
    lockoutThreshold: Math.max(1, input.lockoutThreshold),
  };
}
