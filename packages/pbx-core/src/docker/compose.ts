/** docker-compose.yml の service / port / volume 契約を正規化（golden T-GM-009） */

export type ComposeServiceDraft = Readonly<{
  ports?: readonly string[];
  volumes?: readonly string[];
  environmentKeys?: readonly string[];
}>;

export type ComposeDraft = Readonly<{
  services: Readonly<Record<string, ComposeServiceDraft>>;
  networks?: Readonly<Record<string, Readonly<{ driver?: string }>>>;
}>;

export type NormalizedComposeService = Readonly<{
  name: string;
  ports: readonly string[];
  volumes: readonly string[];
  environmentKeys: readonly string[];
}>;

export type NormalizedComposeNetwork = Readonly<{
  name: string;
  driver: string;
}>;

export type NormalizedCompose = Readonly<{
  services: readonly NormalizedComposeService[];
  networks: readonly NormalizedComposeNetwork[];
}>;

export function normalizeDockerCompose(draft: ComposeDraft): NormalizedCompose {
  const services = Object.keys(draft.services)
    .sort()
    .map((name) => {
      const s = draft.services[name]!;
      return {
        name,
        ports: [...(s.ports ?? [])].sort(),
        volumes: [...(s.volumes ?? [])].sort(),
        environmentKeys: [...(s.environmentKeys ?? [])].sort(),
      };
    });
  const networks = Object.keys(draft.networks ?? {})
    .sort()
    .map((name) => ({
      name,
      driver: draft.networks![name]?.driver ?? 'bridge',
    }));
  return { services, networks };
}
