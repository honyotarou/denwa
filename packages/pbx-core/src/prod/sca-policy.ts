/** SCA advisory 型（T-SEC-SCA-002/003） */

export type ScaAdvisory = Readonly<{
  name: string;
  severity: string;
  via: readonly string[];
}>;
