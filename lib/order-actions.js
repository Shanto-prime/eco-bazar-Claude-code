"use server";

// lib/order-actions.js
// Server action for placing an order. The critical bit is the transactional
// inventory decrement: check stock, decrement it, and insert the order all in
// one DB transaction. If two customers try to buy the last unit at the same
// time, the second one gets a stock-out error instead of both succeeding.
//
// Note there is no row locking   MongoDB has none to take. The guarantee comes
// from the `stock: { gte: qty }` predicate on the decrementing updateMany: the
// filter and the update are evaluated atomically per document, so a racing order
// that already took the stock makes our update match 0 documents, and we roll
// the transaction back. See the loop below.

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "./prisma";
import { auth } from "../auth";
import { toDollars } from "./money";
import { liveOfferOf, discountedMinor } from "./offers";

// Order.number is @unique. It used to be "ECO-" + the last 6 digits of
// Date.now(), which repeats every 10^6 ms   about every 16.7 minutes   so two
// orders placed a cycle apart collided and the second checkout failed with a
// unique-constraint error. Draw the suffix from a CSPRNG instead: 32^8 ≈ 1.1e12
// possibilities, and a collision is retried below rather than surfacing.
//
// The alphabet omits I, O, 0 and 1 so a customer reading the number aloud to
// support can't transcribe it ambiguously.
const NUMBER_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function makeOrderNumber() {
    const bytes = crypto.randomBytes(8);
    let out = "";
    for (const b of bytes) out += NUMBER_ALPHABET[b % NUMBER_ALPHABET.length];
    return `ECO-${out}`;
}

// True for a Prisma unique-constraint violation on Order.number.
function isDuplicateNumber(err) {
    return (
        err?.code === "P2002" &&
        String(err?.meta?.target ?? "").includes("number")
    );
}

const BillingSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    street: z.string().min(1),
    country: z.string().min(1),
    state: z.string().min(1), // Division (বিভাগ)
    city: z.string().min(1), // District / Jella (জেলা)
    thana: z.string().min(1), // Thana / Upazila (থানা/উপজেলা)
    zip: z.string().optional(), // postcode   optional in Bangladesh
    email: z.string().email(),
    phone: z.string().min(7),
    notes: z.string().optional(),
    payment: z
        .enum(["COD", "PAYPAL", "AMAZON", "BKASH", "NAGAD"])
        .default("COD"),
});

const ItemSchema = z.object({
    slug: z.string(),
    qty: z.number().int().positive(),
});

// `items` is `[{slug, qty}, ...]` from the client cart. We compute the
// authoritative price + name from the DB so the client can't tamper with
// what they pay.
export async function placeOrderAction({ billing, items, couponCode }) {
    const billingData = BillingSchema.parse(billing);
    const lines = z.array(ItemSchema).min(1).parse(items);

    const session = await auth();
    const userId = session?.user?.id || null;

    // A fresh order number is drawn per attempt, so a (vanishingly rare) collision
    // is retried rather than failing the customer's checkout. Every other error
    // out of stock, missing product   propagates on the first attempt.
    let result;
    for (let attempt = 1; ; attempt++) {
        try {
            result = await runPlaceOrder({
                billingData,
                lines,
                couponCode,
                userId,
            });
            break;
        } catch (err) {
            if (isDuplicateNumber(err) && attempt < 5) continue;
            throw err;
        }
    }

    // After commit: invalidate any pages that show stock or new orders.
    revalidatePath("/shop");
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard");

    // Convert the authoritative cents total back to dollars at the boundary.
    // `signedIn` lets the client decide where to send the buyer next: /dashboard
    // is auth-gated by middleware, so redirecting a guest there would bounce them
    // to /unauthorized right after a successful purchase.
    return {
        ok: true,
        orderId: result.id,
        number: result.number,
        total: toDollars(result.total),
        signedIn: Boolean(userId),
    };
}

// One attempt at the whole purchase, in a single transaction: re-read prices,
// check stock, decrement it under a guard, insert the order.
async function runPlaceOrder({ billingData, lines, couponCode, userId }) {
    const number = makeOrderNumber();

    return prisma.$transaction(async (tx) => {
        // Fetch products in a single query. `offers` rides along because a live Hot
        // Deals offer IS the selling price   the customer is shown the discounted
        // figure, so that is what must be charged. Resolving it here (rather than
        // trusting the cart) keeps the anti-tampering guarantee intact: the client
        // still cannot influence the price, only which product it is buying.
        const products = await tx.product.findMany({
            where: { slug: { in: lines.map((l) => l.slug) } },
            select: {
                id: true,
                slug: true,
                name: true,
                price: true,
                stock: true,
                offers: {
                    where: { active: true, endsAt: { gt: new Date() } },
                    orderBy: { endsAt: "asc" },
                    // `active` must be selected even though the where-clause already
                    // filters on it: isOfferLive() re-checks the field, and an unselected
                    // `active` arrives as undefined, which reads as "not live" and would
                    // silently charge the full price on a discounted product.
                    select: { percentOff: true, endsAt: true, active: true },
                },
            },
        });
        const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));

        // One clock for the whole order, so two lines can't straddle an expiry and
        // price the same offer differently.
        const now = Date.now();

        // Validate stock availability for every line.
        for (const l of lines) {
            const p = bySlug[l.slug];
            if (!p) throw new Error(`Product no longer available: ${l.slug}`);
            if (p.stock < l.qty)
                throw new Error(
                    `Out of stock: only ${p.stock} left of ${p.name}`,
                );
        }

        // Compute totals from DB-side prices. All amounts are INTEGER CENTS
        // p.price is already cents, so every intermediate stays an integer and there
        // are no floating-point rounding artefacts.
        let subtotal = 0;
        const orderItemsData = lines.map((l) => {
            const p = bySlug[l.slug];
            // Live offer → the discounted price. OrderItem.unitPrice is a snapshot, so
            // the order keeps the sale price it was placed at even after the offer ends.
            const offer = liveOfferOf(p, now);
            const unit = offer
                ? discountedMinor(p.price, offer.percentOff)
                : p.price; // integer cents
            subtotal += unit * l.qty;
            return {
                productId: p.id,
                productSlug: p.slug,
                productName: p.name,
                unitPrice: unit,
                qty: l.qty,
            };
        });

        // Coupon (very simple   keep in sync with CartContext.COUPONS). Coupon
        // values are expressed in dollars; flat amounts are converted to cents.
        let discount = 0;
        const COUPONS = {
            ECO10: { type: "percent", value: 10 },
            ECO20: { type: "percent", value: 20 },
            FREE5: { type: "flat", value: 5 },
        };
        if (couponCode) {
            const c = COUPONS[couponCode.toUpperCase()];
            if (c)
                discount =
                    c.type === "percent"
                        ? Math.round(subtotal * (c.value / 100))
                        : c.value * 100;
            discount = Math.min(discount, subtotal);
        }
        const total = subtotal - discount; // integer cents

        // Atomic decrement using a guarded `update` per product. The `where`
        // clause includes `stock: { gte: qty }` so a race condition that drops
        // stock to 0 between our findMany and update will cause the update to
        // affect 0 rows   which Prisma surfaces as a "Record not found" error
        // and rolls the whole transaction back.
        for (const l of lines) {
            const p = bySlug[l.slug];
            const upd = await tx.product.updateMany({
                where: { id: p.id, stock: { gte: l.qty } },
                data: { stock: { decrement: l.qty } },
            });
            if (upd.count === 0) throw new Error(`Out of stock: ${p.name}`);
        }

        // Create the order with snapshot line items.
        const order = await tx.order.create({
            data: {
                number,
                userId,
                email: billingData.email,
                phone: billingData.phone,
                firstName: billingData.firstName,
                lastName: billingData.lastName,
                street: billingData.street,
                city: billingData.city,
                thana: billingData.thana,
                state: billingData.state,
                zip: billingData.zip,
                country: billingData.country,
                notes: billingData.notes,
                subtotal,
                discount,
                shipping: 0,
                total,
                couponCode: couponCode || null,
                payment: billingData.payment,
                items: { create: orderItemsData },
                // Seed the status timeline with the order's own creation, so the
                // customer-facing history never has a gap before the first admin edit.
                // actorId stays null: this transition is the purchase itself, not an
                // admin action (and guests have no user row at all).
                history: { create: [{ status: "PENDING" }] },
            },
            select: { id: true, number: true, total: true },
        });

        return order;
    });
}
