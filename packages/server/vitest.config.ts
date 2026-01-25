import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        name: 'server',
        environment: 'node',
        globals: true,
        clearMocks: true,
        restoreMocks: true,
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/**/*.test.ts'],
        exclude: [
            'node_modules',
            'dist',
            // Skip integration tests in CI (they require API keys)
            ...(process.env.CI ? ['src/**/*.integration.test.ts'] : []),
        ],
        // Sequential execution for database isolation
        sequence: {
            concurrent: false,
        },
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/**/__tests__/**', 'src/index.ts', 'src/**/*.d.ts'],
            thresholds: {
                lines: 75,
                functions: 75,
                statements: 75,
                branches: 70,
            },
        },
    },
    resolve: {
        alias: {
            '@yshvydak-job-screener/shared': path.resolve(__dirname, '../../shared/src'),
        },
    },
})
