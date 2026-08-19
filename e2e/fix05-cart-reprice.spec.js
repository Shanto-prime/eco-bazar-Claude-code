// e2e/fix05-cart-reprice.spec.js
//
// FIX 5 — the cart could show a price the customer would not be charged.
//
// Cart items store the price they had when they were added. Checkout always
// recomputes from the DB (so nobody is ever charged a tampered figure), but that
// also meant the cart could DISPLAY a stale number. Hot Deals offers turned this
// from theoretical into likely: when an offer EXPIRES while items sit in the cart,
// the buyer was charged MORE than the summary showed.
//
// CartContext now re-reads authoritative prices via repriceCart() whenever the set
// of items changes. The dangerous direction — stale price LOWER than real — is the
// one that matters most, so it is tested explicitly.

import { test, expect } from "@playwright/test";
import { newPrisma } from "./db";
import { seedGuestCart } from "./helpers";

const SLUG = "green-apple";

let prisma;
let realPrice;  // major units, exactly as the cart will display it
let stalePrice; // a wrong price guaranteed to differ from realPrice

test.beforeAll(async () => {
  prisma = newPrisma();
  const p = await prisma.product.findUnique({
    where:  { slug: SLUG },
    select: { price: true, offers: { where: { active: true }, select: { percentOff: true, endsAt: true } } },
  });
  if (!p) throw new Error(`Seed product "${SLUG}" missing — run npm run db:seed`);

  // The authoritative price is OFFER-AWARE: the seed puts a live Hot Deals offer
  // on this product, so the cart shows the discounted figure, not Product.price.
  // Mirrors discountedMinor() in lib/offers.js.
  const live = p.offers.find((o) => new Date(o.endsAt).getTime() > Date.now());
  const minor = live
    ? Math.max(1, Math.round((p.price * (100 - live.percentOff)) / 100))
    : p.price;

  // Money is stored in integer minor units; the UI shows major units.
  realPrice = (minor / 100).toFixed(2);
  // Derive the "stale" figure from the real one so the two can never collide —
  // hardcoding 7.50 broke the moment a 50%-off offer made 7.50 the CORRECT price.
  stalePrice = Number((minor / 100 / 2).toFixed(2));
  if (stalePrice.toFixed(2) === realPrice) stalePrice = Number(realPrice) + 3.01;
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

async function cartPriceFor(page, stalePrice, staleName = "STALE NAME") {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await seedGuestCart(page, [{ slug: SLUG, name: staleName, price: stalePrice, qty: 1 }]);
  await page.goto("/cart", { waitUntil: "networkidle" });
  // Repricing is a server round-trip after hydration.
  await expect.poll(async () => (await page.locator("body").innerText()).includes(realPrice), { timeout: 15_000 })
    .toBe(true);
  return page.locator("body").innerText();
}

test.describe("Fix 5 — the cart reprices from the database", () => {
  test("a stale LOWER price is corrected upward (the expired-offer case)", async ({ page }) => {
    // Half the real price is what a 50%-off offer would have stored. Once it
    // lapses, the real price is higher — this is the case where the old code
    // undercharged on screen and then charged MORE at checkout.
    const text = await cartPriceFor(page, stalePrice);

    expect(text).toContain(realPrice);
    expect(text).not.toContain(stalePrice.toFixed(2));
  });

  test("a stale HIGHER price is corrected downward", async ({ page }) => {
    const text = await cartPriceFor(page, 999.99);

    expect(text).toContain(realPrice);
    expect(text).not.toContain("999.99");
  });

  test("a renamed product picks up its current name", async ({ page }) => {
    const text = await cartPriceFor(page, stalePrice, "Totally Wrong Name");
    expect(text).not.toContain("Totally Wrong Name");
  });

  test("repricing settles instead of looping", async ({ page }) => {
    // The reducer returns the SAME state object when nothing changed, and the
    // effect keys off the slug list rather than the items — without both, this
    // would re-fire forever.
    let posts = 0;
    page.on("request", (r) => { if (r.method() === "POST") posts++; });

    await cartPriceFor(page, stalePrice);
    const settled = posts;
    await page.waitForTimeout(4000);

    expect(posts).toBe(settled);
  });

  test("a cart item whose product no longer exists is dropped", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await seedGuestCart(page, [{ slug: "deleted-product-xyz", name: "Ghost", price: 5, qty: 1 }]);
    await page.goto("/cart", { waitUntil: "networkidle" });

    // Rather than failing at checkout with "Product no longer available".
    await expect.poll(async () => (await page.locator("body").innerText()).includes("Ghost"), { timeout: 15_000 })
      .toBe(false);
  });
});
