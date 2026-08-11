"use server";

// app/orders/lookup/_actions.js — public "track my order" lookup.
//
// WHY THIS EXISTS: guest checkout is supported (Order.userId may be null), but
// /dashboard/orders scopes a customer to `{ userId: user.id }`, so a guest order
// belonged to nobody and had no page at all. A guest finished checkout holding an
// order number they could never use.
//
// WHY NOT auto-attach guest orders to an account with the same email: email
// verification is issued but NOT enforced at login, so anyone could register with
// a stranger's address and inherit their order history — including the delivery
// address and phone number on it. Requiring BOTH the order number and the email
// keeps that shut: the number is a 32^8 random string (see lib/order-actions.js),
// so it can't be guessed, and the pair can't be enumerated.

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { rateLimit, clientIp } from "../../../lib/rate-limit";
import { toDollars } from "../../../lib/money";

const Schema = z.object({
  number: z.string().trim().min(3).max(40),
  email:  z.string().trim().toLowerCase().email(),
});

export async function lookupOrderAction(formData) {
  // Throttle per IP. Without this the endpoint would be an oracle for testing
  // number/email pairs, even though guessing one is already impractical.
  //
  // A server action has no Request argument, so the proxy headers come from
  // next/headers. clientIp() only needs something with a .headers.get().
  const ip = clientIp({ headers: await headers() });
  const rl = rateLimit(`order-lookup:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) return { ok: false, error: "Too many lookups. Please try again shortly." };

  let data;
  try {
    data = Schema.parse({
      number: formData.get("number"),
      email:  formData.get("email"),
    });
  } catch {
    return { ok: false, error: "Enter the order number and the email you used." };
  }

  const order = await prisma.order.findFirst({
    // Order numbers are stored uppercase ("ECO-…"); accept whatever case the
    // customer typed off their confirmation screen.
    where: { number: data.number.toUpperCase(), email: data.email },
    select: {
      number: true, status: true, paymentStatus: true, payment: true,
      createdAt: true, subtotal: true, discount: true, shipping: true, total: true,
      firstName: true, lastName: true, street: true, thana: true, city: true,
      state: true, zip: true, country: true,
      items: { select: { productName: true, productSlug: true, qty: true, unitPrice: true } },
      history: { orderBy: { createdAt: "asc" }, select: { status: true, createdAt: true } },
    },
  });

  // One generic message for "no such number" and "wrong email", so the response
  // never confirms that an order number exists.
  if (!order) return { ok: false, error: "No order matches that number and email." };

  // Money out in major units; dates as ISO strings so <LocalTime> can render them
  // in the visitor's own timezone.
  return {
    ok: true,
    order: {
      ...order,
      subtotal: toDollars(order.subtotal),
      discount: toDollars(order.discount),
      shipping: toDollars(order.shipping),
      total:    toDollars(order.total),
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((i) => ({ ...i, unitPrice: toDollars(i.unitPrice) })),
      history: order.history.map((h) => ({ status: h.status, createdAt: h.createdAt.toISOString() })),
    },
  };
}
