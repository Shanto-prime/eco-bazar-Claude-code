// e2e/fix08-product-suggestions.spec.js
//
// FIX 8 — the soft-404's "did you mean …?" suggestions came from the seed file.
//
// /shop/<unknown-slug> scored lib/data.js (the static starter catalogue) rather
// than the database. Two consequences: it could recommend a product an admin had
// since deleted — clicking it produced ANOTHER 404 — and every card showed the
// seed price instead of the current one, including ignoring live Hot Deals offers.
//
// The matching logic moved to lib/product-suggest.js and now scores DB rows.

import { test, expect } from "@playwright/test";
import { newPrisma } from "./db";

let prisma;

test.beforeAll(async () => {
  prisma = newPrisma();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("Fix 8 — soft-404 suggestions come from the database", () => {
  test("a near-miss slug still suggests the right product", async ({ page }) => {
    // "grenapl" → "green-apple" via the full-slug similarity path.
    await page.goto("/shop/grenapl", { waitUntil: "networkidle" });

    await expect(page.locator('a[href="/shop/green-apple"]').first()).toBeVisible();
  });

  test("every suggested link resolves to a real product page", async ({ page }) => {
    await page.goto("/shop/totally-unknown-slug-xyz", { waitUntil: "networkidle" });

    const hrefs = await page.locator('a[href^="/shop/"]').evaluateAll((as) =>
      [...new Set(as.map((a) => a.getAttribute("href")))].filter((h) => h && h !== "/shop"),
    );
    expect(hrefs.length, "the 404 page should offer something").toBeGreaterThan(0);

    // Every suggestion must exist in the DB — the old code could offer deleted
    // products, sending the visitor from one 404 to another.
    const slugs = hrefs.map((h) => h.replace("/shop/", ""));
    const found = await prisma.product.findMany({
      where:  { slug: { in: slugs } },
      select: { slug: true },
    });
    expect(found.map((p) => p.slug).sort()).toEqual(slugs.sort());
  });

  test("suggested cards show the current DB price", async ({ page }) => {
    const product = await prisma.product.findUnique({
      where:  { slug: "green-apple" },
      select: { price: true, offers: { where: { active: true }, select: { percentOff: true, endsAt: true } } },
    });
    test.skip(!product, "seed product missing — run npm run db:seed");

    // Mirror the effective-price rule in lib/offers.js.
    const live = product.offers.find((o) => new Date(o.endsAt).getTime() > Date.now());
    const minor = live
      ? Math.max(1, Math.round((product.price * (100 - live.percentOff)) / 100))
      : product.price;
    const expected = (minor / 100).toFixed(2);

    await page.goto("/shop/grenapl", { waitUntil: "networkidle" });

    const text = await page.locator("body").innerText();
    expect(text).toContain(expected);
  });

  test("a product deleted from the DB is never suggested", async ({ page }) => {
    // Create a product with a very distinctive slug, then delete it, and confirm
    // a close query no longer offers it.
    const created = await prisma.product.create({
      data: {
        slug: "e2e-fix08-ghost-berry", name: "E2E Fix08 Ghost Berry",
        price: 1234, stock: 5,
        createdById: (await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } })).id,
      },
      select: { id: true },
    });
    await prisma.product.delete({ where: { id: created.id } });

    await page.goto("/shop/e2e-fix08-ghost-bery", { waitUntil: "networkidle" });

    await expect(page.locator('a[href="/shop/e2e-fix08-ghost-berry"]')).toHaveCount(0);
  });
});
