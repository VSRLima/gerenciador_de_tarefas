import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '../..');
const baseURL = 'http://127.0.0.1:4173';
const apiURL = 'http://127.0.0.1:3001';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev --workspace apps/api',
      cwd: repoRoot,
      url: `${apiURL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV ?? 'test',
        PORT: '3001',
        API_URL: apiURL,
        MONGO_URL:
          process.env.MONGO_URL ??
          'mongodb://localhost:27017/task-manager?replicaSet=rs0&directConnection=true',
        REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
        JWT_SECRET: process.env.JWT_SECRET ?? 'test-secret',
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
        SWAGGER_LOCAL_USER: process.env.SWAGGER_LOCAL_USER ?? 'swagger',
        SWAGGER_LOCAL_PASS: process.env.SWAGGER_LOCAL_PASS ?? 'swagger',
      },
    },
    {
      command:
        'npm run dev --workspace apps/web -- --host 127.0.0.1 --port 4173',
      cwd: repoRoot,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        ...process.env,
        VITE_API_URL: `${apiURL}/api`,
      },
    },
  ],
});
