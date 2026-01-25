import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    envDir: '../../',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@yshvydak-job-screener/shared': path.resolve(__dirname, '../../shared/src')
        }
    },
    server: {
        port: parseInt(process.env.VITE_PORT || '3000', 10),
        host: '0.0.0.0',
        hmr: {
            overlay: true
        }
    },
    build: {
        target: 'esnext',
        chunkSizeWarningLimit: 1000,
        sourcemap: true
    }
});
