import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      include: [
        'src/cdr/filter.ts',
        'src/cdr/record-input.ts',
        'src/billing/detail-rows.ts',
        'src/runtime/poll-intervals.ts',
        'src/concurrency/chart.ts',
        'src/home/device-summary.ts',
      ],
      thresholds: {
        branches: 90,
      },
    },
  },
});
