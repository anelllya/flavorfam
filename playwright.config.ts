import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  reporter: [['list'], ['json', { outputFile: 'test-results/report.json' }]],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' } },
  use: { baseURL: 'http://localhost:4173', ...devices['Pixel 7'], viewport: { width: 393, height: 852 } },
  projects: [
    { name: 'dark', use: { colorScheme: 'dark' } },
    { name: 'light', use: { colorScheme: 'light' } },
  ],
  webServer: { command: 'npx vite preview --port 4173 --strictPort', port: 4173, reuseExistingServer: !process.env.CI },
});
