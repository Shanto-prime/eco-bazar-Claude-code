// e2e/checkout.spec.js — guest order placement (the critical revenue path).
//
// This WRITES to the DB: placeOrderAction creates an Order and decrements the
// product's stock inside a transaction. To stay repeatable, afterEach deletes
// any order this suite created (cascading its items/events) and restores the
// product's stock to the snapshot taken before the run.
import { test, expect } from "@playwright/test";
import { newPrisma } from "./db";

const SLUG = "green-apple";
const TEST_EMAIL = "e2e-checkout@ecobazar.test";
const CART_KEY = "ecobazar-cart-v1";

let prisma;
let stockBefore;

test.beforeAll(async () => {
  prisma = newPrisma();
  const p = await prisma.product.findUnique({ where: { slug: SLUG }, select: { stock: true } });
  if (!p) throw new Error(`Seed product "${SLUG}" missing — run npm run db:seed`);
  stockBefore = p.stock;
});

test.afterEach(async () => {
  // Remove orders this suite placed (OrderItem/OrderStatusEvent cascade), then
  // put the stock back exactly where it started.
  await prisma.order.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.product.update({ where: { slug: SLUG }, data: { stock: stockBefore } });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

function cartCount(page) {
  return page.evaluate((key) => {
    try { return JSON.parse(localStorage.getItem(key) || "{}")?.items?.length || 0; }
    catch { return 0; }
  }, CART_KEY);
}

test.describe("Checkout — order placement", () => {
  test("a guest can place an order and gets an order number", async ({ page }) => {
    // 1) Put a product in the cart and confirm it registered.
    await page.goto(`/shop/${SLUG}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect.poll(() => cartCount(page), { timeout: 10_000 }).toBeGreaterThan(0);

    // 2) Fill the billing form (name attributes added for a11y + testability).
    await page.goto("/checkout", { waitUntil: "networkidle" });
    await page.locator('input[name="firstName"]').fill("E2E");
    await page.locator('input[name="lastName"]').fill("Tester");
    await page.locator('input[name="street"]').fill("123 Test Street");
    await page.locator('select[name="country"]').selectOption("USA");
    await page.locator('select[name="state"]').selectOption("Illinois");
    await page.locator('input[name="zip"]').fill("60601");
    await page.locator('input[name="email"]').fill(TEST_EMAIL);
    await page.locator('input[name="phone"]').fill("01712345678");

    // 3) Place the order (default payment = Cash on Delivery).
    await page.getByRole("button", { name: /place order/i }).click();

    // 4) Thank-you screen with a real ECO-###### order number.
    await expect(page.getByRole("heading", { name: /thank you/i })).toBeVisible();
    // The order number shows in both the confirmation text and a toast — either is fine.
    await expect(page.getByText(/ECO-\d{6}/).first()).toBeVisible();

    // 5) The order actually persisted to the DB with the right email.
    await expect
      .poll(() => prisma.order.count({ where: { email: TEST_EMAIL } }), { timeout: 10_000 })
      .toBe(1);
  });

  test("checkout blocks submission when required fields are empty", async ({ page }) => {
    await page.goto(`/shop/${SLUG}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect.poll(() => cartCount(page), { timeout: 10_000 }).toBeGreaterThan(0);

    await page.goto("/checkout", { waitUntil: "networkidle" });
    // Submit with an empty form — client validation must stop it.
    await page.getByRole("button", { name: /place order/i }).click();

    // No thank-you, still on checkout, and nothing was written to the DB.
    await expect(page.getByRole("heading", { name: /thank you/i })).toHaveCount(0);
    await expect(page).toHaveURL(/\/checkout/);
    expect(await prisma.order.count({ where: { email: TEST_EMAIL } })).toBe(0);
  });
});
