import { defineConfig, devices, type Project } from '@playwright/test';

// In der Cloud-Entwicklungsumgebung ist nur Chromium vorinstalliert (PW_CHROMIUM_PATH).
// In GitHub Actions laufen Chromium und WebKit (E2E_ENGINES).
const engines = (process.env.E2E_ENGINES ?? 'chromium,webkit').split(',').map((e) => e.trim());
const chromiumLaunch = process.env.PW_CHROMIUM_PATH
  ? { executablePath: process.env.PW_CHROMIUM_PATH }
  : {};

const projects: Project[] = [];
if (engines.includes('chromium')) {
  projects.push(
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], launchOptions: chromiumLaunch },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'], launchOptions: chromiumLaunch },
    },
  );
}
if (engines.includes('webkit')) {
  projects.push(
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'] } },
    { name: 'webkit-mobile', use: { ...devices['iPhone 15'] } },
  );
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'de-AT',
    timezoneId: 'Europe/Vienna',
    trace: 'retain-on-failure',
  },
  projects,
  webServer: {
    command: 'pnpm preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
