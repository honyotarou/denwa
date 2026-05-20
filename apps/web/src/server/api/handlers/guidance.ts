import { upsertGuidance } from '@openpbx/db/repos/guidances';
import { saveGuidanceWav } from '@openpbx/infra/fs/guidance';
import { PBX_CONFIG_WRITE_MIN_ROLE, validateGuidanceName, validateWavHeader } from '@openpbx/core';
import type { AppContext } from '../../context';
import type { JsonHandlerResult } from '../types';
import { withAuth } from '../with-auth';

export async function handleGuidancesPost(
  ctx: AppContext,
  name: string,
  wav: Uint8Array,
): Promise<JsonHandlerResult> {
  return withAuth(
    ctx,
    async () => {
      const nameErr = validateGuidanceName(name);
      if (nameErr) return { status: 400, body: { error: nameErr } };
      const wavErr = validateWavHeader(wav);
      if (wavErr) return { status: 400, body: { error: wavErr } };
      try {
        await saveGuidanceWav(ctx.infraDirs.soundsDir, name, wav);
        upsertGuidance(ctx.db, { name });
        return { status: 201, body: { ok: true } };
      } catch (e) {
        return { status: 400, body: { error: (e as Error).message } };
      }
    },
    { minRole: PBX_CONFIG_WRITE_MIN_ROLE },
  );
}
