import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 180000, // 3 minutes for e2e tests
    hookTimeout: 120000, // 2 minutes for setup/teardown hooks (registration can be slow)
    globals: true,
    include: ['tests/e2e/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test-results/junit-e2e.xml',
    },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
