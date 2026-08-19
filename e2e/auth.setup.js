// e2e/auth.setup.js — signs in once per account and saves the session.
//
// Runs as a Playwright "setup" project that every other project depends on (see
// playwright.config.js), so it completes before any spec starts.
//
// WHY: the app rate-limits credential logins to 10 attempts per 15 minutes per
// identifier (lib/rate-limit.js, applied in lib/auth.js authorize()). A suite that
// logs in inside every test exhausts that, and the 11th attempt simply never
// redirects — which surfaces as `page.waitForURL` timing out on /login and looks
// exactly like a product bug. Logging in here once keeps a full run at one login
// per account.
//
// This can't be done in a spec's beforeAll: `test.use({ storageState })` also
// applies to contexts created in hooks, so the hook meant to CREATE the file
// fails reading it (ENOENT).

import { test as setup } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { login, authFile } from "./helpers";

const ACCOUNTS = [
  { username: "admin",    password: "admin" },
  { username: "customer", password: "customer" },
];

for (const { username, password } of ACCOUNTS) {
  setup(`authenticate as ${username}`, async ({ page, context }) => {
    fs.mkdirSync(path.dirname(authFile(username)), { recursive: true });
    await login(page, username, password);
    await context.storageState({ path: authFile(username) });
  });
}
