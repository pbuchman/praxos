import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    // Global setup for Firestore emulator
    globalSetup: ['./packages/infra/firestore/src/testing/vitest.globalSetup.ts'],
    setupFiles: ['./packages/infra/firestore/src/testing/vitest.setup.ts'],
    // Run tests sequentially to avoid emulator race conditions
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Longer timeout for emulator operations
    testTimeout: 10000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/**/src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/testing/**',
        '**/*.spec.ts',
        '**/index.ts',
        '**/*.d.ts',
        // Exclude type-only files (no runtime code)
        'packages/domain/identity/**/*.ts',
        'packages/domain/promptvault/src/ports.ts',
        'packages/domain/promptvault/src/ports/**/*.ts',
        'packages/domain/promptvault/src/models/Prompt.ts',
        // Exclude testing utilities (emulator, fakes)
        'packages/infra/firestore/src/testing/**/*.ts',
      ],
      thresholds: {
        lines: 90,
        branches: 85,
        functions: 90,
        statements: 90,
      },
    },
  },
});
