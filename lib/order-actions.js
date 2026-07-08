"use server";

// lib/order-actions.js
// Server action for placing an order. The critical bit is the transactional
// inventory decrement: we lock the product rows, check stock, decrement,
// and insert the order all in one DB transaction. If two customers try to
// buy the last unit at the same time, the second one gets a stock-out
// error instead of both succeeding.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "./prisma";
import { auth } from "../auth";

const BillingSchema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  street:    z.string().min(1),
  country:   z.string().min(1),
  state:     z.string().min(1),
  zip:       z.string().min(1),
  email:     z.string().email(),
  phone:     z.string().min(7),
  notes:     z.string().optional(),
  payment:   z.enum(["COD", "PAYPAL", "AMAZON", "BKASH", "NAGAD"]).default("COD"),
});

const ItemSchema = z.object({
  slug: z.string(),
  qty:  z.number().int().positive(),
});

// `items` is `[{slug, qty}, ...]` from the client cart. We compute the
// authoritative price + name from the DB so the client can't tamper with
// what they pay.
export async function placeOrderAction({ billing, items, couponCode }) {
  const billingData = BillingSchema.parse(billing);
  const lines = z.array(ItemSchema).min(1).parse(items);

  const session = await auth();
  const userId = session?.user?.id || null;

  // Generate a friendly order number once. Roll our own to keep it short.
  const number = "ECO-" + Date.now().toString().slice(-6);

  const result = await prisma.$transaction(async (tx) => {
    // Lock & fetch products in a single query.
    const products = await tx.product.findMany({
      where: { slug: { in: lines.map((l) => l.slug) } },
      select: { id: true, slug: true, name: true, price: true, stock: true },
    });
    const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));

    // Validate stock availability for every line.
    for (const l of lines) {
      const p = bySlug[l.slug];
      if (!p)              throw new Error(`Product no longer available: ${l.slug}`);
      if (p.stock < l.qty) throw new Error(`Out of stock: only ${p.stock} left of ${p.name}`);
    }

    // Compute totals from DB-side prices.
    let subtotal = 0;
    const orderItemsData = lines.map((l) => {
      const p = bySlug[l.slug];
      const unit = Number(p.price);
      subtotal += unit * l.qty;
      return { productId: p.id, productSlug: p.slug, productName: p.name, unitPrice: unit, qty: l.qty };
    });

    // Coupon (very simple — keep in sync with CartContext.COUPONS).
    let discount = 0;
    const COUPONS = { ECO10: { type: "percent", value: 10 }, ECO20: { type: "percent", value: 20 }, FREE5: { type: "flat", value: 5 } };
    if (couponCode) {
      const c = COUPONS[couponCode.toUpperCase()];
      if (c) discount = c.type === "percent" ? subtotal * (c.value / 100) : c.value;
      discount = Math.min(discount, subtotal);
    }
    const total = subtotal - discount;

    // Atomic decrement using a guarded `update` per product. The `where`
    // clause includes `stock: { gte: qty }` so a race condition that drops
    // stock to 0 between our findMany and update will cause the update to
    // affect 0 rows — which Prisma surfaces as a "Record not found" error
    // and rolls the whole transaction back.
    for (const l of lines) {
      const p = bySlug[l.slug];
      const upd = await tx.product.updateMany({
        where: { id: p.id, stock: { gte: l.qty } },
        data:  { stock: { decrement: l.qty } },
      });
      if (upd.count === 0) throw new Error(`Out of stock: ${p.name}`);
    }

    // Create the order with snapshot line items.
    const order = await tx.order.create({
      data: {
        number,
        userId,
        email:     billingData.email,
        phone:     billingData.phone,
        firstName: billingData.firstName,
        lastName:  billingData.lastName,
        street:    billingData.street,
        state:     billingData.state,
        zip:       billingData.zip,
        country:   billingData.country,
        notes:     billingData.notes,
        subtotal,
        discount,
        shipping:  0,
        total,
        couponCode: couponCode || null,
        payment:    billingData.payment,
        items:     { create: orderItemsData },
      },
      select: { id: true, number: true, total: true },
    });

    return order;
  });

  // After commit: invalidate any pages that show stock or new orders.
  revalidatePath("/shop");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");

  return { ok: true, orderId: result.id, number: result.number, total: Number(result.total) };
}
