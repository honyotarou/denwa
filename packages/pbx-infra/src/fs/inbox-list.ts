import fs from 'node:fs/promises';
import path from 'node:path';

export async function listRecordingFiles(dir: string) {
  try {
    const names = await fs.readdir(dir);
    const wavs = names.filter((n) => n.endsWith('.wav'));
    const out: Array<{ name: string; size: number }> = [];
    for (const name of wavs.slice(0, 500)) {
      const st = await fs.stat(path.join(dir, name));
      out.push({ name, size: st.size });
    }
    return out.sort((a, b) => b.name.localeCompare(a.name));
  } catch {
    return [];
  }
}

export async function countInboxFiles(dir: string) {
  try {
    const names = await fs.readdir(dir);
    return {
      wav: names.filter((n) => n.endsWith('.wav')).length,
      meta: names.filter((n) => n.endsWith('.meta.json')).length,
    };
  } catch {
    return { wav: -1, meta: -1 };
  }
}
