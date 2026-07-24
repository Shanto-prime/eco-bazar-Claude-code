"use server";

// lib/cart-actions.js
// Server actions for the database-backed cart (logged-in users only). Guests
// keep their cart in localStorage; these actions run when a session exists.
//
//   getCart()                          → { items, coupon, wishlist } | null
//   saveCart(items, coupon, wishlist)  → persist cart + wishlist       (write)
//   mergeCart(items, coupon)           → merge a guest cart into the   (login)
//                                        user's saved cart; returns it + wishlist
//
// All three no-op safely when there is no session, so the client can call them
// unconditionally. Item shape mirrors the client cart: { slug, name, icon,
// price, qty }. Prices are display-only — checkout recomputes them from the DB.
// The WISHLIST is an array of product slugs and is per-user (signed-in only) —
// guests never have one, so it lives in the DB, not localStorage.

import { z } from "zod";
import { prisma } from "./prisma";
import { getCurrentUser } from "./auth-helpers";

const MAX_ITEMS = 200;
const MAX_QTY = 99;

const CartItemSchema = z.object({
  slug:  z.string().min(1).max(200),
  name:  z.string().min(1).max(300),
  icon:  z.string().max(300).nullish(),
  price: z.number().nonnegative(),
  qty:   z.number().int().min(1).max(MAX_QTY),
});

const ItemsSchema = z.array(CartItemSchema).max(MAX_ITEMS);

// Coupon is derived client-side from a fixed table; store it as-is or null.
function cleanCoupon(coupon) {
  return coupon && typeof coupon === "object" ? coupon : null;
}

// Best-effort parse: drop malformed items rather than reject the whole cart,
// so a single bad row never blocks a save.
function safeItems(items) {
  if (!Array.isArray(items)) return [];
  const out = [];
  for (const raw of items.slice(0, MAX_ITEMS)) {
    const parsed = CartItemSchema.safeParse(raw);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

// Wishlist = array of unique non-empty product slugs, capped.
function safeWishlist(wishlist) {
  if (!Array.isArray(wishlist)) return [];
  const seen = new Set();
  for (const s of wishlist) {
    if (typeof s === "string" && s && s.length <= 200) seen.add(s);
    if (seen.size >= MAX_ITEMS) break;
  }
  return [...seen];
}

export async function getCart() {
  const user = await getCurrentUser();
  if (!user) return null;
  const row = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (!row) return { items: [], coupon: null, wishlist: [] };
  return { items: safeItems(row.items), coupon: cleanCoupon(row.coupon), wishlist: safeWishlist(row.wishlist) };
}

export async function saveCart(items, coupon = null, wishlist = []) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  const clean = safeItems(items);
  ItemsSchema.parse(clean); // guard against exceeding limits
  const cleanedCoupon = cleanCoupon(coupon);
  const cleanWishlist = safeWishlist(wishlist);

  await prisma.cart.upsert({
    where:  { userId: user.id },
    update: { items: clean, coupon: cleanedCoupon, wishlist: cleanWishlist },
    create: { userId: user.id, items: clean, coupon: cleanedCoupon, wishlist: cleanWishlist },
  });
  return { ok: true };
}

export async function mergeCart(items, coupon = null) {
  const user = await getCurrentUser();
  if (!user) return null;

  const incoming = safeItems(items);
  const existing = await prisma.cart.findUnique({ where: { userId: user.id } });
  const current = existing ? safeItems(existing.items) : [];

  // Union by slug; when an item is in both the guest cart and the saved cart,
  // add the quantities (the guest was actively adding to it), clamped to MAX_QTY.
  const map = new Map();
  for (const it of current) map.set(it.slug, { ...it });
  for (const it of incoming) {
    const ex = map.get(it.slug);
    if (ex) ex.qty = Math.min(MAX_QTY, ex.qty + it.qty);
    else map.set(it.slug, { ...it });
  }
  const merged = [...map.values()].slice(0, MAX_ITEMS);

  // Keep an existing saved coupon; otherwise adopt the guest's.
  const mergedCoupon = cleanCoupon(existing?.coupon) || cleanCoupon(coupon);
  // Wishlist is the user's own (guests never have one) — preserve it untouched.
  const wishlist = safeWishlist(existing?.wishlist);

  await prisma.cart.upsert({
    where:  { userId: user.id },
    update: { items: merged, coupon: mergedCoupon },
    create: { userId: user.id, items: merged, coupon: mergedCoupon, wishlist },
  });

  return { items: merged, coupon: mergedCoupon, wishlist };
}
