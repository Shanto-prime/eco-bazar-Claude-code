// e2e/dashboard.spec.js — role-gated dashboard navigation + settings + currency.
import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Dashboard — admin", () => {
  test.beforeEach(async ({ page }) => login(page, "admin", "admin"));

  test("admin sees admin-only nav (Users, Profile requests, Audit log)", async ({ page }) => {
    await page.goto("/dashboard");
    const nav = page.locator("aside").first();
    await expect(nav.getByRole("link", { name: /users/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /profile requests/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /audit log/i })).toBeVisible();
  });

  test("settings page shows Profile, Email & phone, Password, Addresses", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { name: /^settings$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /profile/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /email .* phone/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /addresses/i })).toBeVisible();
  });

  test("admin-only Store currency card is present on settings", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { name: /store currency/i })).toBeVisible();
    // The BDT→USD/AED rate inputs exist.
    await expect(page.locator('input[name="rate_USD"]')).toBeVisible();
    await expect(page.locator('input[name="rate_AED"]')).toBeVisible();
  });

  test("profile-requests queue page loads", async ({ page }) => {
    await page.goto("/dashboard/profile-requests");
    await expect(page.getByRole("heading", { name: /profile requests/i })).toBeVisible();
  });
});

test.describe("Dashboard — customer", () => {
  test.beforeEach(async ({ page }) => login(page, "customer", "customer"));

  test("customer does NOT see admin-only sections", async ({ page }) => {
    await page.goto("/dashboard");
    const nav = page.locator("aside").first();
    await expect(nav.getByRole("link", { name: /users/i })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: /audit log/i })).toHaveCount(0);
  });

  test("customer settings has NO Store currency card", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { name: /^settings$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /store currency/i })).toHaveCount(0);
  });

  test("customer is redirected away from the admin-only users page", async ({ page }) => {
    await page.goto("/dashboard/users");
    // requireRole("ADMIN") redirects a customer to /unauthorized.
    await expect(page).toHaveURL(/\/unauthorized/);
  });
});
