import { defineConfig, devices } from "@playwright/test";

/**
 * Zoobicon End-to-End Tests
 *
 * These tests simulate a REAL customer clicking through the site.
 * They catch issues that code scanning can't — blank pages, broken
 * layouts, buttons that don't work, forms that don't submit.
 *
 * Run locally: npx playwright test
 * Run in CI: automatically via .github/workflows/e2e.yml
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  timeout: 30000,

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
        },
      },
    },
    {
      name: "Mobile Safari",
      use: {
        ...devices["iPhone 13"],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
        },
      },
    },
    {
      name: "Tablet",
      use: {
        ...devices["iPad (gen 7)"],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
        },
      },
    },
  ],

  webServer: process.env.CI ? undefined : {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
