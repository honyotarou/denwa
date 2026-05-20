import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [['**/*softphone-panel*.test.tsx', 'jsdom']],
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
