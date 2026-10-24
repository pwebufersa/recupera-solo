import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  reporter: [['list']],
  outputDir: '../test-results',
  use: {
    baseURL: 'http://127.0.0.1:8099',
    channel: process.env.CI ? undefined : 'chrome',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node servidor.js',
    url: 'http://127.0.0.1:8099/',
    reuseExistingServer: !process.env.CI
  },
  projects: [
    {
      name: 'computador',
      use: { viewport: { width: 1280, height: 900 } }
    },
    {
      name: 'celular',
      use: { ...devices['Pixel 7'] }
    }
  ]
});
