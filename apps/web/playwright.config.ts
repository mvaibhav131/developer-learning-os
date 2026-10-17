import { defineConfig, devices } from '@playwright/test';

// The end-to-end suite runs against its own API and database on separate ports, so it never
// touches the data you use while developing (`pnpm dev` uses 4000/5173 and data/dlos.sqlite).
const apiPort = 4100;
const webPort = 5273;
const baseURL = `http://localhost:${webPort}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // db:reset recreates data/e2e.sqlite with a fresh 24-week plan that starts today.
      command: 'pnpm --filter @dlos/api db:reset --yes && pnpm --filter @dlos/api dev',
      url: `http://127.0.0.1:${apiPort}/api/v1/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        API_PORT: String(apiPort),
        DATABASE_PATH: 'data/e2e.sqlite',
        ALLOWED_ORIGINS: `${baseURL},http://127.0.0.1:${webPort}`,
        APP_TIMEZONE: 'Asia/Kolkata',
        LOG_LEVEL: 'warn',
      },
    },
    {
      command: 'pnpm --filter @dlos/web dev',
      url: baseURL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { WEB_PORT: String(webPort), API_PORT: String(apiPort) },
    },
  ],
});
