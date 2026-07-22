// e2e/cart.spec.js — cart add/remove flow (client-only, localStorage-backed).
import { test, expect } from "@playwright/test";

const CART_KEY = "ecobazar-cart-v1";

// Number of line items currently in the persisted cart. Reading localStorage
// directly is the reliable signal that an add-to-cart actually registered —
// clicking the button before CartContext hydrates would otherwise be a silent
// no-op and race the test.
function cartCount(page) {
  return page.evaluate((key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}")?.items?.length || 0;
    } catch {
      return 0;
    }
  }, CART_KEY);
}

// Open a product page and add it, waiting until the cart state confirms it.
async function addProduct(page, slug) {
  await page.goto(`/shop/${slug}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /add to cart/i }).click();
  await expect.poll(() => cartCount(page), { timeout: 10_000 }).toBeGreaterThan(0);
}

test.describe("Cart", () => {
  test("empty cart shows the empty state", async ({ page }) => {
    await page.goto("/cart");
    // Empty cart renders a "go to shop" CTA rather than a line-item table.
    await expect(page.locator('a[href="/shop"]').first()).toBeVisible();
  });

  test("adding a product from its detail page puts it in the cart", async ({ page }) => {
    await addProduct(page, "green-apple");

    await page.goto("/cart");
    await expect(page.locator('a[href="/shop/green-apple"]').first()).toBeVisible();
    // A BDT total is shown.
    await expect(page.getByText("৳", { exact: false }).first()).toBeVisible();
  });

  test("cart persists across a reload (localStorage)", async ({ page }) => {
    await addProduct(page, "green-apple");

    await page.goto("/cart");
    await expect(page.locator('a[href="/shop/green-apple"]').first()).toBeVisible();

    await page.reload();
    await expect(page.locator('a[href="/shop/green-apple"]').first()).toBeVisible();
  });
});
