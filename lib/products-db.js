// lib/products-db.js
// Database-backed read queries for the customer site. Once the DB is set up
// and seeded, customer pages should call these instead of importing from
// lib/data.js (which is now used only by the seed script as the initial
// catalogue).

import { prisma } from "./prisma";

// Plain-object shape the React components expect. Decimal → number.
function shape(p) {
  return {
    id:          p.id,
    slug:        p.slug,
    name:        p.name,
    description: p.description,
    price:       Number(p.price),
    oldPrice:    p.oldPrice ? Number(p.oldPrice) : null,
    badge:       p.badge,
    rating:      p.rating || 0,
    stock:       p.stock,
    images:      (p.images || []).map((img) => ({ type: "image", src: img.url, label: img.alt || "" })),
  };
}

export async function listProducts({ take = 30, skip = 0, q, sort = "latest" } = {}) {
  const where = {};
  // MySQL's default utf8mb4_unicode_ci collation is already case-insensitive,
  // so we omit Prisma's `mode: "insensitive"` (which is PostgreSQL-only).
  if (q) where.OR = [
    { name: { contains: q } },
    { slug: { contains: q } },
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
  return rows.map(shape);
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
