import { describe, expect, it } from 'vitest';
import { checkHealth } from '../services/health';
import { handleHealthGet } from '../api-handlers';

describe('T-HEALTH-001', () => {
  it('Given sqlite When checkHealth Then db ok', () => {
    expect(checkHealth()).toEqual({ ok: true, db: true });
  });

  it('Given health API When GET Then 200 and db', async () => {
    const r = await handleHealthGet();
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, db: true });
  });
});
