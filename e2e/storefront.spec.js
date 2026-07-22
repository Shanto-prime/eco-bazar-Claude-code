// e2e/storefront.spec.js — public storefront: home, shop, search, product detail.
import { test, expect } from "@playwright/test";

test.describe("Storefront", () => {
  test("home page loads with hero and product grid", async ({ page }) => {
    await page.goto("/");
    // The site chrome is always present.
    await expect(page.locator("header").first()).toBeVisible();
    // Seeded products render as cards linking to /shop/<slug>.
    await expect(page.locator('a[href^="/shop/"]').first()).toBeVisible();
  });

  test("prices display in BDT (৳) by default", async ({ page }) => {
    await page.goto("/shop");
    // Base currency is BDT, so the taka sign appears on price labels.
    await expect(page.getByText("৳", { exact: false }).first()).toBeVisible();
  });

  test("shop lists products and search filters by query", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.locator('a[href^="/shop/"]').first()).toBeVisible();

    // Search narrows results; /shop?q=apple should surface the green apple.
    await page.goto("/shop?q=apple");
    await expect(page.locator('a[href="/shop/green-apple"]').first()).toBeVisible();
  });

  test("product detail page shows name, price and Add to Cart", async ({ page }) => {
    await page.goto("/shop/green-apple");
    await expect(page.getByRole("heading", { name: /green apple/i })).toBeVisible();
    await expect(page.getByText("৳", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible();
  });

  test("unknown product slug shows a soft-404 with suggestions", async ({ page }) => {
    await page.goto("/shop/this-does-not-exist-xyz");
    // ProductNotFound renders a "browse shop" style CTA, not a hard 404.
    await expect(page.locator('a[href="/shop"]').first()).toBeVisible();
    await expect(page.locator('a[href^="/shop/"]').first()).toBeVisible();
  });
});
