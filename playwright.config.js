// playwright.config.js
// End-to-end test config for the Ecobazar storefront + dashboard.
//
// The suite drives the REAL app: Playwright boots `npm run dev` (webServer
// below) and hits it at baseURL. That means these tests need the same runtime
// dependencies the app needs — a seeded MongoDB replica set reachable via
// DATABASE_URL. Run `npm run db:push && npm run db:seed` once before testing.
//
// Chromium only, headless, run serially-ish (workers:1) because several specs
// share one dev server + one database and a couple mutate global state.

import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // First run compiles routes on demand, which is slow; give assertions room.
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  // Boot the app for the tests. reuseExistingServer lets you keep a dev server
  // running locally and just re-run the specs against it.
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: true,
    stdout: "ignore",
    stderr: "pipe",
  },
});
