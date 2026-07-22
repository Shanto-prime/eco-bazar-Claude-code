// e2e/helpers.js — shared test helpers.
import { expect } from "@playwright/test";

// Sign in through the real credentials form.
//
// Two dev-mode hazards this guards against:
//   1. Pre-hydration native submit — clicking the submit button before Next has
//      hydrated does a plain GET (URL ends up /login?username=…), and the SPA
//      navigation never happens. Waiting for networkidle ensures the client
//      bundle has loaded + run before we interact.
//   2. Cold-compile latency — the FIRST hit of /dashboard in `next dev` compiles
//      on demand and can take well over 20s, so the post-login wait is generous.
export async function login(page, username, password) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  // Sanity: the field is interactive (hydrated forms keep the typed value).
  await expect(page.locator("#username")).toHaveValue(username);

  await page.getByRole("button", { name: /log ?in|sign ?in/i }).first().click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 60_000 });
}
