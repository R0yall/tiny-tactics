import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true
  },
  webServer: [
    {
      command: 'npm run dev:server',
      port: 2567,
      reuseExistingServer: true,
      timeout: 15000
    },
    {
      command: 'npm run dev:web',
      port: 3000,
      reuseExistingServer: true,
      timeout: 15000
    }
  ]
});
