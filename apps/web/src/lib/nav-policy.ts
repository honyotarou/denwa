/** Nav 表示ポリシー（T-NET-013/014, T-PAT-024, T-TRIAGE-013）— UI と分離 */

export type NavRole = 'user' | 'supervisor' | 'admin';

export function showNetworkLink(role: NavRole): boolean {
  return role === 'admin';
}

export function showPatientsLink(_role: NavRole): boolean {
  return true;
}

export function showTriageLink(_role: NavRole): boolean {
  return true;
}
