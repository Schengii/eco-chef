import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    testMatch: '**/*.e2e.ts',
    timeout: 30_000,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: 'http://localhost:4444',
        trace: 'retain-on-failure',
        serviceWorkers: 'block'
    },
    projects: [{ name: 'chromium', use: { ...devices['Pixel 7'] } }],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:4444',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000
    }
});
