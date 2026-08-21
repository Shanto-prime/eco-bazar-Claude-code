// e2e/fix06-order-lookup.spec.js
//
// FIX 6   guest orders were unreachable.
//
// Guest checkout is supported (Order.userId may be null), but
// /dashboard/orders scopes a customer to `{ userId: user.id }`. A guest therefore
// finished checkout holding an order number with no page that would accept it.
//
// /orders/lookup takes the order number AND the checkout email together. Both are
// required on purpose: email verification is not enforced at login, so attaching
// guest orders to any account sharing the email would let someone register with a
// stranger's address and read their delivery details.
//
// This WRITES to the DB, so afterEach removes the order and restores stock.

import { test, expect } from "@playwright/test";
import { newPrisma } from "./db";
import { fillCheckoutAddress, seedGuestCart, ORDER_NUMBER_RE } from "./helpers";

const SLUG = "green-apple";
const EMAIL = "e2e-fix06@ecobazar.test";

let prisma;
let stockBefore;

test.beforeAll(async () => {
    prisma = newPrisma();
    const p = await prisma.product.findUnique({
        where: { slug: SLUG },
        select: { stock: true },
    });
    if (!p)
        throw new Error(`Seed product "${SLUG}" missing   run npm run db:seed`);
    stockBefore = p.stock;
});

test.afterEach(async () => {
    await prisma.order.deleteMany({ where: { email: EMAIL } });
    await prisma.product.update({
        where: { slug: SLUG },
        data: { stock: stockBefore },
    });
});

test.afterAll(async () => {
    await prisma.$disconnect();
});

// Place a guest order and return its number.
async function placeGuestOrder(page) {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await seedGuestCart(page, [
        { slug: SLUG, name: "Green Apple", price: 14.99, qty: 1 },
    ]);

    await page.goto("/checkout", { waitUntil: "networkidle" });
    await page.locator('input[name="firstName"]').fill("Guest");
    await page.locator('input[name="lastName"]').fill("Lookup");
    await page.locator('input[name="street"]').fill("12 Probe Road");
    await fillCheckoutAddress(page);
    await page.locator('input[name="email"]').fill(EMAIL);
    await page.locator('input[name="phone"]').fill("01712345678");

    await page.getByRole("button", { name: /place order/i }).click();
    await expect(page.getByRole("heading", { name: /thank you/i })).toBeVisible(
        { timeout: 30_000 },
    );

    const text = await page.locator("body").innerText();
    const num = (text.match(ORDER_NUMBER_RE) || [])[0];
    expect(
        num,
        "the confirmation screen must show an order number",
    ).toBeTruthy();
    return num;
}

async function lookup(page, number, email) {
    await page.goto("/orders/lookup", { waitUntil: "networkidle" });
    await page.locator('input[name="number"]').fill(number);
    await page.locator('input[name="email"]').fill(email);
    await page.getByRole("button", { name: /find my order/i }).click();
    // Either the result panel or the refusal message settles.
    await page.waitForTimeout(2500);
    return page.locator("body").innerText();
}

test.describe("Fix 6   a guest can find their order", () => {
    test("the confirmation screen gives a guest a way to use the number", async ({
        page,
    }) => {
        const num = await placeGuestOrder(page);
        // Without this link the number on screen is a dead end for a guest.
        await expect(page.locator('a[href*="/orders/lookup"]')).toBeVisible();
        expect(num).toMatch(ORDER_NUMBER_RE);
    });

    test("the correct number + email finds the order", async ({ page }) => {
        const num = await placeGuestOrder(page);
        const text = await lookup(page, num, EMAIL);

        expect(text).toContain(num);
        expect(text).toContain("Green Apple");
    });

    test("the number is accepted case-insensitively", async ({ page }) => {
        const num = await placeGuestOrder(page);
        const text = await lookup(page, num.toLowerCase(), EMAIL);

        expect(text).toContain(num); // stored/displayed uppercase
    });

    test("the right number with the WRONG email is refused", async ({
        page,
    }) => {
        const num = await placeGuestOrder(page);
        const text = await lookup(page, num, "someone.else@example.com");

        expect(text).toMatch(/No order matches/i);
        expect(text).not.toContain("Green Apple");
    });

    test("a made-up number is refused with the same generic message", async ({
        page,
    }) => {
        await placeGuestOrder(page);
        const text = await lookup(page, "ECO-ZZZZZZZZ", EMAIL);

        // Identical wording to the wrong-email case, so the response never confirms
        // that a given order number exists.
        expect(text).toMatch(/No order matches/i);
    });

    test("the lookup page is reachable without signing in", async ({
        page,
    }) => {
        const res = await page.goto("/orders/lookup", {
            waitUntil: "domcontentloaded",
        });
        expect(res?.status()).toBe(200);
        await expect(page).toHaveURL(/\/orders\/lookup/); // not bounced to /login
    });
});
