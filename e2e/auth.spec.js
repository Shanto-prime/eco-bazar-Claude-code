// e2e/auth.spec.js — authentication + middleware route protection.
// Uses the seeded credentials accounts (admin/admin, customer/customer).
import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Authentication", () => {
  test("anonymous access to /dashboard is bounced to /unauthorized", async ({ page }) => {
    await page.goto("/dashboard");
    // middleware.js redirects signed-out users to /unauthorized?next=...
    await expect(page).toHaveURL(/\/unauthorized/);
  });

  test("invalid credentials show an error and stay on /login", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#username").fill("admin");
    await page.locator("#password").fill("wrong-password");
    await page.getByRole("button", { name: /log ?in|sign ?in/i }).first().click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("customer can log in and reach their dashboard", async ({ page }) => {
    await login(page, "customer", "customer");
    await expect(page).toHaveURL(/\/dashboard/);
    // The dashboard sidebar carries the role as an exact uppercase badge —
    // scope to <aside> so the top-bar greeting tooltip ("Hi, Demo Customer")
    // doesn't match on the substring.
    await expect(
      page.locator("aside").first().getByText("CUSTOMER", { exact: true }).first(),
    ).toBeVisible();
  });
});
