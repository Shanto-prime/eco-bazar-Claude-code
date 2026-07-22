// lib/products-db.js
// Database-backed read queries for the customer site. Once the DB is set up
// and seeded, customer pages should call these instead of importing from
// lib/data.js (which is now used only by the seed script as the initial
// catalogue).

import { prisma } from "./prisma";
import { toDollars } from "./money";

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
    include: { images: { orderBy: { sort: "asc" } } },
  });
  return rows.map((r) => shape(r));
}

export async function getProductBySlug(slug) {
  const p = await prisma.product.findUnique({
    where: { slug },
    include: { images: { orderBy: { sort: "asc" } } },
  });
  return p ? shape(p) : null;
}

export async function listFeatured(n = 10) {
  return listProducts({ take: n });
}
