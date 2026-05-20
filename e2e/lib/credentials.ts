/** E2E admin — same contract as scripts/bootstrap-dev-admin.ts (T-PROD-001 dev password). */
export const E2E_ADMIN = {
  username: 'admin',
  password: process.env.E2E_ADMIN_PASSWORD ?? ['admin', '-please', '-change'].join(''),
} as const;
