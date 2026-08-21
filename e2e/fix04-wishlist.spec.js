// e2e/fix04-wishlist.spec.js
//
// FIX 4   the wishlist silently dropped items past the 200th product.
//
// app/wishlist/page.js loaded `listProducts({ take: 200 })` and let the browser
// filter by slug. So a wishlisted product that happened to fall outside those 200
// rows simply never appeared   no error, no empty state, just gone   and every
// visit shipped the whole catalogue to render a handful of cards.
//
// The wishlist lives in the DB (Cart.wishlist), so the page now reads it
// server-side and fetches exactly those slugs.
//
// The regression test picks a product that sorts LAST by `createdAt desc`   the
// order the old query used   which is precisely the row the 200-row window would
// have cut off first.

import { test, expect } from "@playwright/test";
import { newPrisma } from "./db";
import { authFile } from "./helpers";

const USER = { username: "customer", password: "customer" };

let prisma;
let userId;
let cartBefore;

test.beforeAll(async () => {
    prisma = newPrisma();
    const u = await prisma.user.findFirst({
        where: { username: USER.username },
        select: { id: true },
    });
    if (!u)
        throw new Error(
            `Seed user "${USER.username}" missing   run npm run db:seed`,
        );
    userId = u.id;
    cartBefore = await prisma.cart.findUnique({ where: { userId } });
});

test.afterAll(async () => {
    // Put the user's real cart/wishlist back exactly as it was.
    if (cartBefore) {
        await prisma.cart.update({
            where: { userId },
            data: {
                items: cartBefore.items,
                coupon: cartBefore.coupon,
                wishlist: cartBefore.wishlist,
            },
        });
    } else {
        await prisma.cart.deleteMany({ where: { userId } });
    }
    await prisma.$disconnect();
});

async function setWishlist(slugs) {
    await prisma.cart.upsert({
        where: { userId },
        update: { wishlist: slugs },
        create: { userId, items: [], coupon: null, wishlist: slugs },
    });
}

test.describe("Fix 4   wishlist shows every saved product", () => {
    // Session comes from the "setup" project (e2e/auth.setup.js)   logging in
    // per test would trip the 10-per-15-minutes credentials rate limiter.
    test.use({ storageState: authFile("customer") });

    test("the oldest product in the catalogue still appears", async ({
        page,
    }) => {
        // Oldest by createdAt = last in the old query's ordering = first to be cut.
        const oldest = await prisma.product.findFirst({
            orderBy: { createdAt: "asc" },
            select: { slug: true, name: true },
        });
        expect(oldest).not.toBeNull();

        await setWishlist([oldest.slug]);
        await page.goto("/wishlist", { waitUntil: "networkidle" });

        await expect(
            page.locator(`a[href="/shop/${oldest.slug}"]`).first(),
        ).toBeVisible();
    });

    test("only the saved products are rendered, not the catalogue", async ({
        page,
    }) => {
        const [a, b] = await prisma.product.findMany({
            take: 2,
            select: { slug: true },
        });
        await setWishlist([a.slug, b.slug]);
        await page.goto("/wishlist", { waitUntil: "networkidle" });

        // Exactly the two saved products   the page used to receive up to 200.
        await expect(
            page.locator(`a[href="/shop/${a.slug}"]`).first(),
        ).toBeVisible();
        await expect(
            page.locator(`a[href="/shop/${b.slug}"]`).first(),
        ).toBeVisible();
        await expect
            .poll(() => page.locator('a[href^="/shop/"]').count(), {
                timeout: 10_000,
            })
            .toBeLessThan(10); // 2 cards' worth of links, nowhere near a full catalogue
    });

    test("an empty wishlist shows the empty state", async ({ page }) => {
        await setWishlist([]);
        await page.goto("/wishlist", { waitUntil: "networkidle" });

        await expect(
            page.getByRole("link", { name: /browse products/i }),
        ).toBeVisible();
    });

    test("a wishlisted product that has since been deleted is skipped, not crashed on", async ({
        page,
    }) => {
        await setWishlist(["this-product-does-not-exist-xyz"]);
        const res = await page.goto("/wishlist", { waitUntil: "networkidle" });

        expect(res?.status()).toBe(200);
        await expect(
            page.getByRole("link", { name: /browse products/i }),
        ).toBeVisible();
    });
});
