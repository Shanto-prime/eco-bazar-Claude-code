// e2e/category.spec.js — category-wise search + the "every category shows the
// same products" bug fix. Read-only; no cleanup needed.
import { test, expect } from "@playwright/test";

test.describe("Category search", () => {
  test("selecting a category shows only that category's products", async ({ page }) => {
    await page.goto("/shop?cat=fresh-fruit", { waitUntil: "networkidle" });
    // Green Apple is in Fresh Fruit → shown.
    await expect(page.locator('a[href="/shop/green-apple"]').first()).toBeVisible();
    // Eggplant is in Fresh Vegetables → NOT shown under Fresh Fruit.
    await expect(page.locator('a[href="/shop/eggplant"]')).toHaveCount(0);
    // The active-category banner names the category.
    await expect(page.getByText(/fresh fruit/i).first()).toBeVisible();
  });

  test("different categories show DIFFERENT products (bug fix)", async ({ page }) => {
    // Fresh Vegetables shows eggplant but not the apple…
    await page.goto("/shop?cat=fresh-vegetables", { waitUntil: "networkidle" });
    await expect(page.locator('a[href="/shop/eggplant"]').first()).toBeVisible();
    await expect(page.locator('a[href="/shop/green-apple"]')).toHaveCount(0);

    // …which is the opposite of Fresh Fruit — proving the category param
    // actually filters instead of every category rendering the same list.
    await page.goto("/shop?cat=fresh-fruit", { waitUntil: "networkidle" });
    await expect(page.locator('a[href="/shop/green-apple"]').first()).toBeVisible();
    await expect(page.locator('a[href="/shop/eggplant"]')).toHaveCount(0);
  });

  test("the sidebar Categories list filters when clicked", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByText(/^categories$/i)).toBeVisible();
    await sidebar.getByRole("button", { name: /fresh fruit/i }).click();
    await expect(page).toHaveURL(/cat=fresh-fruit/);
    await expect(page.locator('a[href="/shop/green-apple"]').first()).toBeVisible();
  });
});
