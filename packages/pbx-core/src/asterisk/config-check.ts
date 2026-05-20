import fs from 'node:fs';
import path from 'node:path';

export type AsteriskConfigCheckResult = Readonly<{
  ok: boolean;
  errors: readonly string[];
}>;

const STATIC_CONF_FILES = [
  'asterisk.conf',
  'pjsip.conf',
  'extensions.conf',
  'rtp.conf',
  'manager.conf',
  'modules.conf',
  'logger.conf',
  'http.conf',
  'cdr.conf',
] as const;

const PJSIP_SEED_FILES = [
  'pjsip.d/transports.conf',
  'pjsip.d/trunks.conf',
  'pjsip.d/extensions.conf',
] as const;

/** Phase 2.5: 最小 conf ツリーが読込可能な形か（バイナリ不要の静的 smoke） */
export function checkAsteriskConfigTree(asteriskDir: string): AsteriskConfigCheckResult {
  const errors: string[] = [];

  for (const rel of STATIC_CONF_FILES) {
    const filePath = path.join(asteriskDir, rel);
    if (!fs.existsSync(filePath)) {
      errors.push(`missing: ${rel}`);
      continue;
    }
    const text = fs.readFileSync(filePath, 'utf8');
    if (!text.trim()) {
      errors.push(`empty: ${rel}`);
      continue;
    }
    const iniErr = validateIniLike(rel, text);
    if (iniErr) errors.push(iniErr);
  }

  for (const rel of PJSIP_SEED_FILES) {
    const filePath = path.join(asteriskDir, rel);
    if (!fs.existsSync(filePath)) errors.push(`missing: ${rel}`);
  }

  const pjsipPath = path.join(asteriskDir, 'pjsip.conf');
  if (fs.existsSync(pjsipPath)) {
    for (const inc of parsePjsipIncludes(fs.readFileSync(pjsipPath, 'utf8'))) {
      if (inc.includes('*')) {
        const dir = path.join(asteriskDir, path.dirname(inc));
        if (!fs.existsSync(dir)) errors.push(`include dir missing: ${inc}`);
        continue;
      }
      const target = path.join(asteriskDir, inc);
      if (!fs.existsSync(target)) errors.push(`include target missing: ${inc}`);
    }
  }

  const extPath = path.join(asteriskDir, 'extensions.conf');
  if (fs.existsSync(extPath)) {
    const ext = fs.readFileSync(extPath, 'utf8');
    if (!/\[internal\]/.test(ext)) errors.push('extensions.conf: [internal] context required');
    if (!/MixMonitor/.test(ext)) errors.push('extensions.conf: MixMonitor pattern required (T-AST-001 precursor)');
  }

  const rtpPath = path.join(asteriskDir, 'rtp.conf');
  if (fs.existsSync(rtpPath)) {
    const rtp = fs.readFileSync(rtpPath, 'utf8');
    if (!/rtpstart\s*=\s*10000/.test(rtp)) errors.push('rtp.conf: rtpstart=10000 required');
    if (!/rtpend\s*=\s*10020/.test(rtp)) errors.push('rtp.conf: rtpend=10020 required');
  }

  const mgrPath = path.join(asteriskDir, 'manager.conf');
  if (fs.existsSync(mgrPath)) {
    const mgr = fs.readFileSync(mgrPath, 'utf8');
    if (!/\[command-room\]/.test(mgr)) errors.push('manager.conf: [command-room] section required');
  }

  const dialplanDir = path.join(asteriskDir, 'dialplan.d');
  if (!fs.existsSync(dialplanDir)) errors.push('missing: dialplan.d/');

  return { ok: errors.length === 0, errors };
}

function validateIniLike(rel: string, text: string): string | null {
  if (rel.endsWith('.conf') && !/\[[^\]]+\]/.test(text) && !text.includes('#include')) {
    return `${rel}: expected at least one [section] or #include`;
  }
  if (/\0/.test(text)) return `${rel}: contains NUL byte`;
  return null;
}

function parsePjsipIncludes(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /#include\s+"([^"]+)"/.exec(line.trim());
    if (m) out.push(m[1]!);
  }
  return out;
}
