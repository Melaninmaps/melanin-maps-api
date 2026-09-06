import { defineConfig, devices } from "@playwright/test";

const releaseBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const releaseServerCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: process.env.EXPECTED_RELEASE_SHA ? "./tests/e2e/release-global-setup.ts" : undefined,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: releaseBaseUrl ?? "http://127.0.0.1:80/web/",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
  webServer: releaseServerCommand && releaseBaseUrl ? {
    command: releaseServerCommand,
    url: releaseBaseUrl,
    reuseExistingServer: false,
    timeout: 180_000,
  } : undefined,
  timeout: 45_000,
});
