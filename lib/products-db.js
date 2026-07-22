// lib/products-db.js
// Database-backed read queries for the customer site. Once the DB is set up
// and seeded, customer pages should call these instead of importing from
// lib/data.js (which is now used only by the seed script as the initial
// catalogue).

import { prisma } from "./prisma";
import { toDollars, toCents } from "./money";

// Shared relation include for every product read, so `shape()` always has the
// images + category it expects.
const PRODUCT_INCLUDE = {
  images: { orderBy: { sort: "asc" } },
  category: { select: { slug: true, name: true } },
};

// Plain-object shape the React components expect. Money is stored as integer
// base (BDT) minor units in the DB (see lib/money.js) and converted to major
// units here, at the data-access boundary. Currency conversion for display
// happens later, in lib/currency.js, using the admin's active currency + rate.
function shape(p) {
  return {
    id:          p.id,
    slug:        p.slug,
    name:        p.name,
    description: p.description,
    price:       toDollars(p.price),
    oldPrice:    toDollars(p.oldPrice),
    badge:       p.badge,
    rating:      p.rating || 0,
    stock:       p.stock,
    sku:         p.sku ?? null,
    brand:       p.brand ?? null,
    tags:        p.tags ?? [],
    specifications: p.specifications ?? null,
    // Category (for shop filtering + the category heading). Null when unassigned.
    categorySlug: p.category?.slug ?? null,
    categoryName: p.category?.name ?? null,
    images:      (p.images || []).map((img) => ({ type: "image", src: img.url, label: img.alt || "" })),
    // Convenience field for ProductCard (Home/Shop grids), which renders a
    // single `image` string. Falls back to null → the card shows a placeholder.
    image:       p.images?.[0]?.url ?? null,
  };
}

export async function listProducts({ take = 30, skip = 0, q, sort = "latest" } = {}) {
  const where = {};
  // On MongoDB, `contains` is case-SENSITIVE by default. Prisma's Mongo
  // connector supports `mode: "insensitive"` (unlike the old MySQL setup where
  // the collation handled it), so we opt in to keep search case-insensitive.
  if (q) where.OR = [
    { name: { contains: q, mode: "insensitive" } },
    { slug: { contains: q, mode: "insensitive" } },
  ];
  const orderBy =
    sort === "price-asc"  ? { price: "asc" } :
    sort === "price-desc" ? { price: "desc" } :
    sort === "name"       ? { name: "asc" } :
                            { createdAt: "desc" };
  const rows = await prisma.product.findMany({
    where, orderBy, take, skip,
    include: PRODUCT_INCLUDE,
  });
  return rows.map((r) => shape(r));
}

export async function getProductBySlug(slug) {
  const p = await prisma.product.findUnique({
    where: { slug },
    include: PRODUCT_INCLUDE,
  });
  return p ? shape(p) : null;
}

export async function listFeatured(n = 10) {
  return listProducts({ take: n });
}

// ---------------------------------------------------------------------------
// Best sellers (homepage "Popular Products").
// Ranks products by total quantity sold (summed across OrderItem rows). When
// there are no sales yet, falls back to "offered" products (those on sale — a
// badge or an oldPrice set), and finally to the latest products, so the section
// is never empty. Always returns up to `n` shaped products.
// ---------------------------------------------------------------------------
export async function listBestSellers(n = 10) {
  const out = [];
  const seen = new Set();

  const push = (rows) => {
    for (const r of rows) {
      if (out.length >= n || seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(shape(r));
    }
  };

  // 1) Most-selling: aggregate sold quantity per product from order items.
  //    Sort in JS (avoids relying on Mongo groupBy orderBy-on-aggregate).
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { not: null } },
    _sum: { qty: true },
  });
  const rankedIds = grouped
    .filter((g) => g.productId && (g._sum.qty ?? 0) > 0)
    .sort((a, b) => (b._sum.qty ?? 0) - (a._sum.qty ?? 0))
    .slice(0, n)
    .map((g) => g.productId);

  if (rankedIds.length) {
    const rows = await prisma.product.findMany({
      where: { id: { in: rankedIds } },
      include: PRODUCT_INCLUDE,
    });
    // Preserve the sales ranking order (findMany doesn't guarantee it).
    const byId = new Map(rows.map((r) => [r.id, r]));
    push(rankedIds.map((id) => byId.get(id)).filter(Boolean));
  }

  // 2) Fallback: offered / on-sale products.
  if (out.length < n) {
    const offered = await prisma.product.findMany({
      where: { OR: [{ badge: { not: null } }, { oldPrice: { not: null } }] },
      orderBy: { createdAt: "desc" },
      take: n * 2,
      include: PRODUCT_INCLUDE,
    });
    push(offered);
  }

  // 3) Final fallback: latest products, so the grid is never short.
  if (out.length < n) {
    const latest = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: n * 2,
      include: PRODUCT_INCLUDE,
    });
    push(latest);
  }

  return out.slice(0, n);
}

// ---------------------------------------------------------------------------
// Paginated, server-side filtered product query for the shop. Returns only the
// requested page (default 9) plus the total count for the pager, so the client
// never has to load the whole catalogue at once.
//   q         — name/slug search (case-insensitive)
//   cat       — category slug (exact)
//   minPrice  — dollars (inclusive)   → converted to cents for the DB
//   maxPrice  — dollars; ignored when >= 100 (the slider's "Any")
//   minRating — 0..5 (inclusive)
//   sort      — latest | price-asc | price-desc | name
//   page      — 1-based
//   perPage   — page size (default 9)
// ---------------------------------------------------------------------------
export async function queryProducts({
  q, cat, minPrice = 0, maxPrice = 100, minRating = 0,
  sort = "latest", page = 1, perPage = 9,
} = {}) {
  const where = {};

  if (q) where.OR = [
    { name: { contains: q, mode: "insensitive" } },
    { slug: { contains: q, mode: "insensitive" } },
  ];

  // Category slug → id (Product stores a scalar categoryId).
  if (cat) {
    const category = await prisma.category.findUnique({ where: { slug: cat }, select: { id: true } });
    // Unknown category → no results (rather than silently ignoring the filter).
    where.categoryId = category ? category.id : "__none__";
  }

  // Price stored in cents. Only apply the upper bound when it's a real limit.
  const price = {};
  if (minPrice > 0) price.gte = toCents(minPrice);
  if (maxPrice < 100) price.lte = toCents(maxPrice);
  if (Object.keys(price).length) where.price = price;

  if (minRating > 0) where.rating = { gte: minRating };

  const orderBy =
    sort === "price-asc"  ? { price: "asc" } :
    sort === "price-desc" ? { price: "desc" } :
    sort === "name"       ? { name: "asc" } :
                            { createdAt: "desc" };

  const safePage = Math.max(1, Number(page) || 1);
  const take = Math.max(1, Number(perPage) || 9);
  const skip = (safePage - 1) * take;

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, skip, take, include: PRODUCT_INCLUDE }),
  ]);

  return { items: rows.map((r) => shape(r)), total, page: safePage, perPage: take };
}

// All categories that currently hold at least one product, for the shop
// sidebar (name + slug). Read from the DB so admin-created categories appear.
export async function listCategories() {
  const cats = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true, _count: { select: { products: true } } },
  });
  return cats
    .filter((c) => c._count.products > 0)
    .map((c) => ({ slug: c.slug, name: c.name }));
}

// Products a promo applies to: those whose `badge` equals the tag
// (case-insensitive) OR whose `tags` array contains it. Used by the promo
// landing page (/deals/<slug>) to show "applicable products only".
export async function listProductsByTag(tag, { take = 60 } = {}) {
  if (!tag) return [];
  const rows = await prisma.product.findMany({
    where: {
      OR: [
        { badge: { equals: tag, mode: "insensitive" } },
        { tags:  { has: tag } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take,
    include: PRODUCT_INCLUDE,
  });
  return rows.map((r) => shape(r));
}
