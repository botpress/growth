import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 10000,
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
