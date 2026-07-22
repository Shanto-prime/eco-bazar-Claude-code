// e2e/currency.spec.js — admin switches the store-wide display currency.
//
// This mutates GLOBAL state (the single StoreConfig row), which every visitor's
// prices read from. afterAll resets it to the default (BDT) by clearing the row,
// so the storefront specs that assert ৳ still pass. Because the spec file name
// sorts before "storefront", and workers:1 runs serially, the reset always lands
// before those specs run.
import { test, expect } from "@playwright/test";
import { newPrisma } from "./db";
import { login } from "./helpers";

let prisma;

test.beforeAll(() => { prisma = newPrisma(); });

test.afterAll(async () => {
  // Reset to default currency (no row → getStoreConfig() falls back to BDT).
  await prisma.storeConfig.deleteMany({});
  await prisma.$disconnect();
});

test.describe("Store currency (admin)", () => {
  test("admin switches to USD and the storefront reprices in $", async ({ page }) => {
    // Baseline: storefront is in BDT.
    await page.goto("/shop", { waitUntil: "networkidle" });
    await expect(page.getByText("৳", { exact: false }).first()).toBeVisible();

    // Admin sets USD @ 121 BDT in the Store currency card.
    await login(page, "admin", "admin");
    await page.goto("/dashboard/settings", { waitUntil: "networkidle" });

    const card = page.locator("#currency");
    await expect(card.getByRole("heading", { name: /store currency/i })).toBeVisible();
    await card.locator('select[name="currency"]').selectOption("USD");
    await card.locator('input[name="rate_USD"]').fill("121");
    await card.getByRole("button", { name: /save/i }).click();

    // Success notice confirms the write.
    await expect(card.getByText(/set to USD/i)).toBeVisible();

    // The change is store-wide: the public storefront now prices in dollars.
    await page.goto("/shop", { waitUntil: "networkidle" });
    await expect(page.getByText(/\$\d/).first()).toBeVisible();
    await expect(page.getByText("৳", { exact: false })).toHaveCount(0);

    // And it converted (didn't just relabel): 1499 BDT minor / 121 ≈ $0.12,
    // so no price should read "$14.99" the way it did as ৳14.99.
    await expect(page.getByText("$14.99")).toHaveCount(0);
  });

  test("resetting to BDT restores taka pricing", async ({ page }) => {
    // This test relies on the previous one having switched to USD, then verifies
    // switching back works end to end (also exercises the BDT branch/rate=1).
    await login(page, "admin", "admin");
    await page.goto("/dashboard/settings", { waitUntil: "networkidle" });

    const card = page.locator("#currency");
    await card.locator('select[name="currency"]').selectOption("BDT");
    await card.getByRole("button", { name: /save/i }).click();
    await expect(card.getByText(/set to BDT/i)).toBeVisible();

    await page.goto("/shop", { waitUntil: "networkidle" });
    await expect(page.getByText("৳", { exact: false }).first()).toBeVisible();
  });
});
