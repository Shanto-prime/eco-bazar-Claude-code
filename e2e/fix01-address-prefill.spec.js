// e2e/fix01-address-prefill.spec.js
//
// FIX 1   the address book and checkout used incompatible geography.
//
// lib/geo.js offered USA/Canada/UK + Illinois/California/New York, and the
// address book validated against it. Checkout renders Bangladeshi divisions from
// lib/bd-geo.js and seeds `division` from the saved address's `state`, so a saved
// "Illinois" matched no <option>; React blanked the select and the prefill
// silently vanished. Address also had no `thana` column, so the third selector
// could never prefill at all.
//
// These tests fail on the old code: the address form had no thana field, and
// checkout's division came back empty.

import { test, expect } from "@playwright/test";
import { newPrisma } from "./db";
import { fillAddressBookGeo, authFile } from "./helpers";

const USER = { username: "customer", password: "customer" };
const STREET = "e2e-fix01 Test Road";

let prisma;
let userId;

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
});

// /checkout renders an "empty cart" screen when there is nothing to buy, and the
// billing form   including the three selectors under test   is not rendered at
// all. So the cart has to hold something before the prefill can be observed.
// Written straight to the user's DB cart, which is what CartContext syncs from
// once signed in.
async function seedUserCart() {
    const product = await prisma.product.findFirst({
        select: { slug: true, name: true, price: true },
    });
    const items = [
        {
            slug: product.slug,
            name: product.name,
            price: product.price / 100,
            qty: 1,
        },
    ];
    await prisma.cart.upsert({
        where: { userId },
        update: { items },
        create: { userId, items, coupon: null, wishlist: [] },
    });
}

test.afterEach(async () => {
    // Only remove rows this spec created, so a real address book survives the run.
    await prisma.address.deleteMany({ where: { userId, street: STREET } });
    await prisma.cart.updateMany({ where: { userId }, data: { items: [] } });
});

test.afterAll(async () => {
    await prisma.$disconnect();
});

test.describe("Fix 1   saved address prefills checkout", () => {
    // Session comes from the "setup" project (e2e/auth.setup.js)   logging in
    // per test would trip the 10-per-15-minutes credentials rate limiter.
    test.use({ storageState: authFile("customer") });

    test("the address book offers Bangladeshi divisions, not US states", async ({
        page,
    }) => {
        await page.goto("/dashboard/settings", { waitUntil: "networkidle" });

        // Open the address form (either "Add address" entry point).
        await page
            .getByRole("button", { name: /add address/i })
            .first()
            .click();

        const divisionOptions = await page
            .locator('select[name="state"] option')
            .evaluateAll((os) => os.map((o) => o.textContent.trim()));

        // The old US option set must be gone...
        expect(divisionOptions.join(" ")).not.toMatch(
            /Illinois|California|New York/,
        );
        // ...and replaced by the Bangladesh hierarchy, labelled "English (বাংলা)".
        expect(
            divisionOptions.some((o) => /Dhaka|Barisal|Chattogram/.test(o)),
        ).toBe(true);

        // A thana selector must exist   the column and the field are both new.
        await expect(page.locator('select[name="thana"]')).toHaveCount(1);
    });

    test("a saved Division/District/Thana prefills all three checkout selectors", async ({
        page,
    }) => {
        await page.goto("/dashboard/settings", { waitUntil: "networkidle" });

        await page
            .getByRole("button", { name: /add address/i })
            .first()
            .click();
        await page.locator('input[name="firstName"]').fill("Prefill");
        await page.locator('input[name="lastName"]').fill("Tester");
        await page.locator('input[name="street"]').fill(STREET);

        const chosen = await fillAddressBookGeo(page);

        // Make it the default   checkout only prefills from the default address.
        const defaultBox = page.locator('input[name="isDefault"]');
        if (!(await defaultBox.isChecked())) await defaultBox.check();

        await page
            .getByRole("button", { name: /add address|save address/i })
            .last()
            .click();

        // Confirm it persisted with all three levels, thana included.
        await expect
            .poll(
                () =>
                    prisma.address.findFirst({
                        where: { userId, street: STREET },
                        select: {
                            state: true,
                            city: true,
                            thana: true,
                            country: true,
                        },
                    }),
                { timeout: 15_000 },
            )
            .toEqual({
                state: chosen.state,
                city: chosen.city,
                thana: chosen.thana,
                country: "Bangladesh",
            });

        // Now the payoff: checkout must come up already filled in.
        await seedUserCart();
        await page.goto("/checkout", { waitUntil: "networkidle" });
        await expect(page.locator('select[name="division"]')).toHaveValue(
            chosen.state,
        );
        await expect(page.locator('select[name="district"]')).toHaveValue(
            chosen.city,
        );
        await expect(page.locator('select[name="thana"]')).toHaveValue(
            chosen.thana,
        );
        await expect(page.locator('input[name="street"]')).toHaveValue(STREET);
    });

    test("geography saved before the fix does not poison the prefill", async ({
        page,
    }) => {
        // Exactly the corrupt shape the old code produced.
        await prisma.address.create({
            data: {
                userId,
                firstName: "Legacy",
                lastName: "Row",
                street: STREET,
                state: "Illinois",
                city: "DHAKA",
                country: "USA",
                isDefault: true,
            },
        });
        await seedUserCart();
        await page.goto("/checkout", { waitUntil: "networkidle" });

        // sanitizeBdGeo() drops the invalid triple, so the selectors start empty
        // rather than holding a value with no matching <option>.
        await expect(page.locator('select[name="division"]')).toHaveValue("");
        await expect(page.locator('select[name="district"]')).toHaveValue("");
        // The rest of the address is still usable.
        await expect(page.locator('input[name="street"]')).toHaveValue(STREET);
    });
});
