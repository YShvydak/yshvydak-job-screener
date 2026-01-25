import {defineConfig} from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        clearMocks: true,
        restoreMocks: true,
        testTimeout: 10000,
        projects: ['./packages/server', './packages/web'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/**',
                'dist/**',
                '**/vitest.config.ts',
                '**/vitest.setup.ts',
                '**/*.d.ts',
                '**/index.ts',
                'shared/**',
            ],
        },
    },
})
