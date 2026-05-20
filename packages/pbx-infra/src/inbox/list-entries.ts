import fs from 'node:fs/promises';
import path from 'node:path';

export type InboxEntry = Readonly<{
  metaName: string;
  wavName: string | null;
  kind: string | null;
  extension: string | null;
  callerId: string | null;
  receivedAt: string | null;
  sizeBytes: number;
}>;

function parseMetaFields(raw: string): Pick<InboxEntry, 'kind' | 'extension' | 'callerId' | 'receivedAt'> {
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    return {
      kind: typeof j.kind === 'string' ? j.kind : null,
      extension: typeof j.extension === 'string' ? j.extension : null,
      callerId: typeof j.callerId === 'string' ? j.callerId : null,
      receivedAt: typeof j.receivedAt === 'string' ? j.receivedAt : null,
    };
  } catch {
    return { kind: null, extension: null, callerId: null, receivedAt: null };
  }
}

/** inbox ディレクトリの meta.json 一覧（新しい順、最大 limit 件） */
export async function listInboxEntries(dir: string, limit = 100): Promise<readonly InboxEntry[]> {
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    return [];
  }
  const metas = names.filter((n) => n.endsWith('.meta.json')).sort((a, b) => b.localeCompare(a));
  const out: InboxEntry[] = [];
  for (const metaName of metas.slice(0, limit)) {
    const metaPath = path.join(dir, metaName);
    let sizeBytes = 0;
    let fields = { kind: null, extension: null, callerId: null, receivedAt: null } as ReturnType<
      typeof parseMetaFields
    >;
    try {
      const raw = await fs.readFile(metaPath, 'utf8');
      sizeBytes = Buffer.byteLength(raw, 'utf8');
      fields = parseMetaFields(raw);
    } catch {
      /* skip unreadable */
    }
    const wavBase = metaName.replace(/\.meta\.json$/, '');
    const wavName = names.includes(`${wavBase}.wav`) ? `${wavBase}.wav` : null;
    out.push({
      metaName,
      wavName,
      sizeBytes,
      ...fields,
    });
  }
  return out;
}
