import fs from 'node:fs';
import path from 'node:path';
import type { ComposeDraft, ComposeServiceDraft } from '@openpbx/core';

/** §10.2 Compose volume mapping（T-DOCKER-003） */
export const COMPOSE_SECTION_10_VOLUME_PAIRS = [
  { host: './data/db', container: '/app/data/db' },
  { host: './data/inbox', container: '/app/data/inbox:ro' },
  { host: './data/inbox', container: '/inbox' },
  { host: './data/recordings', container: '/app/data/recordings:ro' },
  { host: './data/recordings', container: '/var/spool/asterisk/monitor' },
  { host: './data/asterisk-cdr', container: '/app/data/asterisk-cdr:ro' },
  { host: './data/asterisk-cdr', container: '/var/log/asterisk/cdr-csv' },
  { host: './asterisk/sounds', container: '/sounds' },
  { host: './data/pbx-out/pjsip.d', container: '/asterisk/pjsip.d' },
  { host: './data/pbx-out/pjsip.d', container: '/etc/asterisk/pjsip.d' },
  { host: './data/pbx-out/dialplan.d', container: '/asterisk/dialplan.d' },
  { host: './data/pbx-out/dialplan.d', container: '/etc/asterisk/dialplan.d' },
  { host: './data/signals', container: '/asterisk/signals' },
  { host: './data/signals', container: '/signals' },
] as const;

const REQUIRED_PORTS = [
  '5060:5060/tcp',
  '5060:5060/udp',
  '10000-10020:10000-10020/udp',
  '3000:3000',
] as const;

/** ホストに公開してはいけない Asterisk 管理 HTTP（PBX-AMI-01） */
export const FORBIDDEN_HOST_PUBLISHED_PORTS = ['8088:8088/tcp', '8089:8089/tcp'] as const;

export function composePublishesForbiddenAsteriskHttp(draft: ComposeDraft): readonly string[] {
  const asteriskPorts = draft.services.asterisk?.ports ?? [];
  return FORBIDDEN_HOST_PUBLISHED_PORTS.filter((p) => asteriskPorts.includes(p));
}

/** リポ root の docker-compose.yml を ComposeDraft に変換（Phase 2.5 smoke） */
export function readComposeDraftFromFile(repoRoot: string): ComposeDraft {
  const filePath = path.join(repoRoot, 'docker-compose.yml');
  const text = fs.readFileSync(filePath, 'utf8');
  return parseDenwaComposeYaml(text);
}

type MutableServiceDraft = {
  ports?: string[];
  volumes?: string[];
  environmentKeys?: string[];
};

export function parseDenwaComposeYaml(text: string): ComposeDraft {
  const lines = text.split(/\r?\n/);
  const services: Record<string, MutableServiceDraft> = {};
  let currentService: string | null = null;
  let currentKey: 'ports' | 'volumes' | 'environment' | null = null;
  let section: 'services' | 'networks' | null = null;

  const ensureService = (name: string) => {
    if (!services[name]) {
      services[name] = { ports: [], volumes: [], environmentKeys: [] };
    }
    return services[name]!;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim() || line.trim().startsWith('#')) continue;

    if (/^services:\s*$/.test(line)) {
      section = 'services';
      currentService = null;
      currentKey = null;
      continue;
    }
    if (/^networks:\s*$/.test(line)) {
      section = 'networks';
      currentService = null;
      currentKey = null;
      continue;
    }
    if (section !== 'services') continue;

    const serviceMatch = /^  ([a-z0-9_-]+):\s*$/.exec(line);
    if (serviceMatch) {
      const name = serviceMatch[1]!;
      currentService = name;
      ensureService(name);
      currentKey = null;
      continue;
    }

    const keyMatch = /^    (ports|volumes|environment):\s*$/.exec(line);
    if (keyMatch && currentService) {
      currentKey = keyMatch[1] as 'ports' | 'volumes' | 'environment';
      continue;
    }

    const listItem = /^      - (.+)$/.exec(line);
    if (listItem && currentService && currentKey) {
      const value = listItem[1]!.trim().replace(/^['"]|['"]$/g, '');
      const svc = ensureService(currentService);
      if (currentKey === 'ports') {
        svc.ports = [...(svc.ports ?? []), value];
      } else if (currentKey === 'volumes') {
        svc.volumes = [...(svc.volumes ?? []), value];
      }
      continue;
    }

    const envKv = /^      ([A-Z0-9_]+):\s*/.exec(line);
    if (envKv && currentService && currentKey === 'environment') {
      const svc = ensureService(currentService);
      svc.environmentKeys = [...(svc.environmentKeys ?? []), envKv[1]!];
    }
  }

  const networks: Record<string, { driver?: string }> = {};
  let inNetworks = false;
  let currentNetwork: string | null = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^networks:\s*$/.test(line)) {
      inNetworks = true;
      continue;
    }
    if (inNetworks) {
      const netMatch = /^  ([a-z0-9_-]+):\s*$/.exec(line);
      if (netMatch) {
        currentNetwork = netMatch[1]!;
        networks[currentNetwork] = { driver: 'bridge' };
        continue;
      }
      const driverMatch = /^    driver:\s*(\S+)/.exec(line);
      if (driverMatch && currentNetwork) {
        networks[currentNetwork] = { driver: driverMatch[1]! };
      }
    }
  }

  return { services, networks } as ComposeDraft;
}

export function composeHasServices(draft: ComposeDraft, names: readonly string[]): boolean {
  const keys = Object.keys(draft.services);
  return names.every((n) => keys.includes(n));
}

export function composeHasPorts(draft: ComposeDraft, serviceName: string, ports: readonly string[]): boolean {
  const svc = draft.services[serviceName];
  if (!svc?.ports) return false;
  const set = new Set(svc.ports);
  return ports.every((p) => set.has(p));
}

export function composeVolumesMatchSection10(draft: ComposeDraft): readonly string[] {
  const allVolumes = Object.values(draft.services).flatMap((s) => s.volumes ?? []);
  const missing: string[] = [];
  for (const { host, container } of COMPOSE_SECTION_10_VOLUME_PAIRS) {
    const needle = `${host}:${container}`;
    const found = allVolumes.some(
      (v) => v === needle || v.startsWith(`${host}:${container}:`),
    );
    if (!found) missing.push(needle);
  }
  return missing;
}

export function asteriskServiceHasPort(draft: ComposeDraft, portSpec: string): boolean {
  return (draft.services.asterisk?.ports ?? []).includes(portSpec);
}

export function webServiceHasPort(draft: ComposeDraft): boolean {
  return (draft.services.web?.ports ?? []).includes('3000:3000');
}

export function allRequiredComposePortsPresent(draft: ComposeDraft): readonly string[] {
  const asteriskPorts = draft.services.asterisk?.ports ?? [];
  const webPorts = draft.services.web?.ports ?? [];
  const combined = new Set([...asteriskPorts, ...webPorts]);
  return REQUIRED_PORTS.filter((p) => !combined.has(p));
}
