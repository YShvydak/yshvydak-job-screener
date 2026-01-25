module.exports = {
    apps: [
        {
            name: 'job-screener-api',
            script: './dist/index.js',
            cwd: './packages/server',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
            },
            time: true,
        },
        {
            name: 'job-screener-web',
            script: 'serve',
            env: {
                PM2_SERVE_PATH: './packages/web/dist',
                PM2_SERVE_PORT: 3000,
                PM2_SERVE_SPA: 'true',
                PM2_SERVE_HOMEPAGE: '/index.html',
            },
        },
    ],
}
