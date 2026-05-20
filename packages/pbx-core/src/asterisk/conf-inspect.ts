/** Asterisk 静的 conf の契約検査（T-AST-001〜008, Phase 8） */

export type ConfInspectResult = Readonly<{
  ok: boolean;
  errors: readonly string[];
}>;

function result(errors: string[]): ConfInspectResult {
  return { ok: errors.length === 0, errors };
}

export function inspectExtensionsConf(text: string): ConfInspectResult {
  const errors: string[] = [];
  if (!/exten\s*=>\s*_100X/i.test(text)) {
    errors.push('extensions.conf: _100X internal pattern required (T-AST-001)');
  }
  if (!/MixMonitor/.test(text)) {
    errors.push('extensions.conf: MixMonitor required (T-AST-001)');
  }
  if (!/exten\s*=>\s*9001/i.test(text) || !/Record\s*\(/.test(text)) {
    errors.push('extensions.conf: 9001 with Record() required (T-AST-002)');
  }
  if (!/exten\s*=>\s*9002/i.test(text)) {
    errors.push('extensions.conf: 9002 required (T-AST-002)');
  }
  if (!/exten\s*=>\s*9000/i.test(text)) {
    errors.push('extensions.conf: 9000 IVR entry required (T-AST-004)');
  }
  if (!/Goto\s*\(\s*9001/i.test(text)) {
    errors.push('extensions.conf: IVR branch 1 -> 9001 required (T-AST-004)');
  }
  if (!/Goto\s*\(\s*9002/i.test(text)) {
    errors.push('extensions.conf: IVR branch 2 -> 9002 required (T-AST-004)');
  }
  if (!/exten\s*=>\s*0,1/i.test(text) || !/Dial\s*\(\s*PJSIP\/1001/i.test(text)) {
    errors.push('extensions.conf: IVR branch 0 -> 1001 required (T-AST-004)');
  }
  if (!/#include\s+"dialplan\.d\/\*\.conf"/.test(text)) {
    errors.push('extensions.conf: dialplan.d/*.conf include required (T-AST-005)');
  }
  if (!/notify-event\.sh/.test(text)) {
    errors.push('extensions.conf: notify-event.sh hangup handler required');
  }
  return result(errors);
}

export function inspectManagerConf(text: string): ConfInspectResult {
  const errors: string[] = [];
  if (!/\[command-room\]/.test(text)) errors.push('manager.conf: [command-room] required (T-AST-006)');
  if (!/secret\s*=/.test(text)) errors.push('manager.conf: secret required (T-AST-006)');
  if (!/permit\s*=/.test(text)) errors.push('manager.conf: permit required (T-AST-006)');
  return result(errors);
}

export function inspectHttpConf(text: string): ConfInspectResult {
  const errors: string[] = [];
  if (!/enabled\s*=\s*yes/i.test(text)) errors.push('http.conf: enabled=yes required (T-AST-007)');
  if (!/bindport\s*=\s*8088/.test(text)) errors.push('http.conf: bindport=8088 required (T-AST-007)');
  if (!/tlsenable\s*=\s*yes/i.test(text)) errors.push('http.conf: tlsenable=yes required (T-AST-007)');
  if (!/8089/.test(text)) errors.push('http.conf: TLS port 8089 required (T-AST-007)');
  return result(errors);
}

export function inspectRtpConf(text: string): ConfInspectResult {
  const errors: string[] = [];
  if (!/rtpstart\s*=\s*10000/.test(text)) errors.push('rtp.conf: rtpstart=10000 required (T-AST-008)');
  if (!/rtpend\s*=\s*10020/.test(text)) errors.push('rtp.conf: rtpend=10020 required (T-AST-008)');
  return result(errors);
}

export function inspectEntrypointReloadWatcher(text: string): ConfInspectResult {
  const errors: string[] = [];
  if (!/pjsip reload/i.test(text)) errors.push('entrypoint.sh: pjsip reload required (T-AST-003)');
  if (!/dialplan reload/i.test(text)) errors.push('entrypoint.sh: dialplan reload required (T-AST-003)');
  if (!/\/signals/.test(text)) errors.push('entrypoint.sh: /signals watcher required (T-AST-003)');
  return result(errors);
}

export const ASTERISK_RTP_PORT_RANGE = '10000-10020:10000-10020/udp' as const;

export function rtpRangeMatchesCompose(rtpText: string, composeAsteriskPorts: readonly string[]): boolean {
  const inspect = inspectRtpConf(rtpText);
  if (!inspect.ok) return false;
  return composeAsteriskPorts.includes(ASTERISK_RTP_PORT_RANGE);
}
