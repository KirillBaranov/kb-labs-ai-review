import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: [
      'packages/**/src/**/*.spec.ts',
      'packages/**/src/**/*.test.ts',
    ],
    environment: 'node',
  },
})
