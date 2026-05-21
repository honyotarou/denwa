/** T-SEC-IMG-002: base image digest pin + multi-stage `FROM <stage>` 参照 */

const DIGEST_FROM = /^FROM\s+.+\@sha256:[a-f0-9]{64}(\s+AS\s+(\S+))?/i;
const STAGE_FROM = /^FROM\s+(\S+)\s+AS\s+(\S+)/i;

function isExternalImageRef(name: string): boolean {
  return name.includes(':') || name.includes('/');
}

/** 未 pin の `FROM` 行を返す（空なら OK） */
export function collectDockerfileFromPinFailures(text: string): readonly string[] {
  const pinnedStages = new Set<string>();
  const failures: string[] = [];

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!/^FROM\s+/i.test(line)) continue;

    const digest = DIGEST_FROM.exec(line);
    if (digest) {
      if (digest[2]) pinnedStages.add(digest[2].toLowerCase());
      continue;
    }

    const stage = STAGE_FROM.exec(line);
    if (
      stage &&
      !isExternalImageRef(stage[1]) &&
      pinnedStages.has(stage[1].toLowerCase())
    ) {
      pinnedStages.add(stage[2].toLowerCase());
      continue;
    }

    failures.push(line);
  }

  return failures;
}
