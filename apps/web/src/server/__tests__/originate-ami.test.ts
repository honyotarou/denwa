import { describe, expect, it, vi } from 'vitest';
import { amiOriginateError } from '@openpbx/infra';
import { handleOriginatePost } from '../api/handlers/originate';
import { createTestContext, loginAsAdmin } from '../context';
import { createStubAmiOriginatePort } from '../ports/ami-originate';

describe('T-API-009 originate AMI', () => {
  it('Given user When originate Then AMI port called and ok', async () => {
    const originate = vi.fn(async () => ({ ok: true, raw: 'Response: Success' }));
    const ctx = await createTestContext({ ami: createStubAmiOriginatePort(originate) });
    ctx.sessionToken = await loginAsAdmin(ctx);
    const r = await handleOriginatePost(ctx, { from: '1001', to: '1002' });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true });
    expect(originate).toHaveBeenCalledWith(
      expect.objectContaining({ from: '1001', to: '1002' }),
    );
  });

  it('Given AMI originate fail When POST Then 502', async () => {
    const ctx = await createTestContext({
      ami: createStubAmiOriginatePort(async () => {
        throw amiOriginateError('ORIGINATE_FAILED', 'busy');
      }),
    });
    ctx.sessionToken = await loginAsAdmin(ctx);
    const r = await handleOriginatePost(ctx, { from: '1001', to: '1002' });
    expect(r.status).toBe(502);
  });

  it('Given missing AMI_SECRET When originate Then 502', async () => {
    const ctx = await createTestContext({
      ami: createStubAmiOriginatePort(async () => {
        throw new Error('AMI_SECRET が未設定です');
      }),
    });
    ctx.sessionToken = await loginAsAdmin(ctx);
    const r = await handleOriginatePost(ctx, { from: '1001', to: '1002' });
    expect(r.status).toBe(502);
  });
});
