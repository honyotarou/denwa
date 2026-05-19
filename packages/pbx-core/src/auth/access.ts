export type Role = 'user' | 'supervisor' | 'admin';

/** API / Server Action が返してよいフィールド（secret 漏洩防止） */
export type ExtensionApiView = Readonly<{
  number: string;
  displayName: string | null;
  note: string | null;
  webrtc: boolean;
  updatedAt: string;
  /** admin のみ。supervisor / user には出さない */
  secret?: string;
}>;

export function extensionForRole(
  ext: ExtensionApiView & { secret: string },
  role: Role,
): ExtensionApiView {
  if (role === 'admin') return ext;
  const { secret: _s, ...rest } = ext;
  return rest;
}

export function canManageTrunks(role: Role): boolean {
  return role === 'admin';
}

export function canViewAudit(role: Role): boolean {
  return role === 'admin' || role === 'supervisor';
}

export function canOriginate(role: Role): boolean {
  return role === 'admin' || role === 'supervisor' || role === 'user';
}
