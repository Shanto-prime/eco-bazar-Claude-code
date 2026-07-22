// e2e/banners.spec.js — promo banners: storefront → /deals landing page, the
// applicable-products filter, and admin gating of the banner manager.
// Read-only against the seeded banners (summer-sale / top-deals / hot-deals,
// all targeting the "Sale 50%" badge).
import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Promo banners — storefront + landing", () => {
  test("a banner on the homepage links to its /deals page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // The seeded banners link to /deals/<slug>; at least one is on the home page.
    const dealLink = page.locator('a[href^="/deals/"]').first();
    await expect(dealLink).toBeVisible();
  });

  test("the /deals landing shows only the applicable products", async ({ page }) => {
    await page.goto("/deals/top-deals", { waitUntil: "networkidle" });
    // Sale 50% products are Green Apple + Green Capsicum → shown.
    await expect(page.locator('a[href="/shop/green-apple"]').first()).toBeVisible();
    await expect(page.locator('a[href="/shop/green-capsicum"]').first()).toBeVisible();
    // A non-sale product (eggplant) must NOT appear.
    await expect(page.locator('a[href="/shop/eggplant"]')).toHaveCount(0);
    // The promo code is shown.
    await expect(page.getByText("SAVE37")).toBeVisible();
  });

  test("an unknown deal slug 404s", async ({ page }) => {
    const res = await page.goto("/deals/no-such-deal-xyz", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(404);
  });
});

test.describe("Promo banners — admin", () => {
  test("admin sees the Banners manager with the seeded banners", async ({ page }) => {
    await login(page, "admin", "admin");
    await page.goto("/dashboard/banners", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /promo banners/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "/deals/top-deals" })).toBeVisible();
    await expect(page.getByRole("button", { name: /add banner/i })).toBeVisible();
  });

  test("a customer cannot reach the Banners manager", async ({ page }) => {
    await login(page, "customer", "customer");
    await page.goto("/dashboard/banners");
    await expect(page).toHaveURL(/\/unauthorized/);
  });
});
