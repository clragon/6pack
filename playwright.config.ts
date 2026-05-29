import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
