// prisma/seed.js
// DEV seed — the one npm run db:seed / npx prisma db seed runs.
//
// What it does:
//   1. Upserts the four test users (login with the username OR email + password):
//        admin    / admin@ecobazar.test    / admin    / ADMIN (isSuperAdmin)
//        mod      / mod@ecobazar.test      / mod      / MODERATOR
//        customer / customer@ecobazar.test / customer / CUSTOMER
//        mamun    / mamun@ecobazar.test    / mamun    / CUSTOMER
//   2. Upserts the 12 categories + realistic product catalogue from
//      prisma/seed-data.js (Bangladeshi organic-grocery items, prices in Taka).
//   3. Attaches one placeholder image per product (deterministic URL from
//      seed-data.js `img()`).
//   4. Seeds two promo banners (TOP + BELOW_LIST) using storefront hero images.
//   5. Seeds two live Hot Deals offers on catalogue products.
//
// The seed is idempotent — every write uses upsert (or delete-then-create for
// images/offers) so re-running never duplicates rows. Old products left over
// from previous seed runs are NOT deleted here; use prisma/seed.prod.js with
// SEED_WIPE_EXISTING=true (or the /dashboard/products UI) to clean those up.
//
// For a production install, don't run this. Use prisma/seed.prod.js instead —
// it takes admin credentials from env vars and never creates test accounts.

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("node:fs");
const path = require("node:path");
const { CATEGORIES, PRODUCTS, toCents, productImageUrl, ratingFor } = require("./seed-data");

// Directory that holds real product photos, same folder admin uploads
// through /dashboard/products write to.
const IMAGE_DIR = path.join(__dirname, "..", "public", "uploads", "products");

// Absolute paths for the primary image and any numbered extras that make
// up a product's gallery.
//   primary:  public/uploads/products/<slug>.jpeg
//   extras:   public/uploads/products/<slug>-2.jpeg, -3.jpeg, ...
// Returns [{ path, url }] in gallery order (primary first, then -2, -3, ...).
function galleryFiles(slug) {
  const out = [];
  const primary = path.join(IMAGE_DIR, `${slug}.jpeg`);
  if (fs.existsSync(primary)) {
    out.push({ path: primary, url: productImageUrl(slug) });
  }
  for (let n = 2; ; n++) {
    const p = path.join(IMAGE_DIR, `${slug}-${n}.jpeg`);
    if (!fs.existsSync(p)) break;
    out.push({ path: p, url: `/uploads/products/${slug}-${n}.jpeg` });
  }
  return out;
}

const prisma = new PrismaClient();

const DEV_USERS = [
  { username: "admin",    email: "admin@ecobazar.test",    password: "admin",    role: "ADMIN",     name: "Site Admin",     isSuperAdmin: true },
  { username: "mod",      email: "mod@ecobazar.test",      password: "mod",      role: "MODERATOR", name: "Demo Moderator", isSuperAdmin: false },
  { username: "customer", email: "customer@ecobazar.test", password: "customer", role: "CUSTOMER",  name: "Demo Customer",  isSuperAdmin: false },
  { username: "mamun",    email: "mamun@ecobazar.test",    password: "mamun",    role: "CUSTOMER",  name: "Mamun",          isSuperAdmin: false },
];

async function seedUsers() {
  const created = {};
  for (const u of DEV_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    created[u.username] = await prisma.user.upsert({
      where:  { email: u.email },
      update: { username: u.username, role: u.role, passwordHash, name: u.name, isSuperAdmin: u.isSuperAdmin },
      create: { username: u.username, email: u.email, name: u.name, role: u.role, passwordHash, isSuperAdmin: u.isSuperAdmin },
    });
  }
  console.log("• Test users (username / email / password):");
  for (const u of DEV_USERS) {
    console.log(`    ${u.username.padEnd(10)} / ${u.email.padEnd(24)} / ${u.password}  (${u.role})`);
  }
  return created;
}

async function seedCategories() {
  const bySlug = {};
  for (const c of CATEGORIES) {
    bySlug[c.slug] = await prisma.category.upsert({
      where:  { slug: c.slug },
      update: { name: c.name, icon: c.icon },
      create: { slug: c.slug, name: c.name, icon: c.icon },
    });
  }
  console.log(`• ${CATEGORIES.length} categories seeded.`);
  return bySlug;
}

async function seedProducts(catBySlug, ownerId) {
  let withImage = 0;
  let noImage = 0;
  const missing = [];
  for (const p of PRODUCTS) {
    const categoryId = catBySlug[p.category]?.id ?? null;
    if (!categoryId) throw new Error(`Unknown category "${p.category}" for product "${p.slug}"`);

    const rating = p.rating != null ? p.rating : ratingFor(p.slug);
    const data = {
      name:           p.name,
      description:    p.description || null,
      price:          toCents(p.price),
      oldPrice:       p.oldPrice == null ? null : toCents(p.oldPrice),
      badge:          p.badge ?? null,
      stock:          p.stock,
      brand:          p.brand ?? null,
      tags:           p.tags ?? [],
      rating,
      categoryId,
    };

    const product = await prisma.product.upsert({
      where:  { slug: p.slug },
      update: data,
      create: { ...data, slug: p.slug, createdById: ownerId },
    });

    // Attach the primary photo + any numbered gallery extras. Products
    // without any file stay image-less so the storefront's ProductCard
    // shows a placeholder instead of a broken image.
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    const gallery = galleryFiles(p.slug);
    if (gallery.length === 0) {
      noImage++;
      missing.push(p.slug);
      continue;
    }
    for (let i = 0; i < gallery.length; i++) {
      await prisma.productImage.create({
        data: { productId: product.id, url: gallery[i].url, alt: p.name, sort: i },
      });
    }
    withImage++;
    if (gallery.length > 1) console.log(`  ${p.slug}: ${gallery.length}-image gallery`);
  }
  console.log(`• ${PRODUCTS.length} products seeded (${withImage} with real photo, ${noImage} image-less).`);
  if (missing.length) console.log(`  Image-less: ${missing.join(", ")}`);
}

async function seedBanners(ownerId) {
  const BANNERS = [
    { slug: "seasonal-picks",  title: "Seasonal picks — up to 25% off", placement: "TOP",        image: "/images/hero-summer.jpg",  promoCode: "SEASON25", targetTag: "seasonal" },
    { slug: "premium-selection", title: "Premium selection — Hilsa, Sundarban honey & more", placement: "BELOW_LIST", image: "/images/banner-37off.jpg", promoCode: "PREMIUM", targetTag: "premium" },
  ];
  for (const b of BANNERS) {
    await prisma.promoBanner.upsert({
      where:  { slug: b.slug },
      update: { title: b.title, imageUrl: b.image, placement: b.placement, promoCode: b.promoCode, targetTag: b.targetTag, active: true },
      create: {
        slug: b.slug, title: b.title, imageUrl: b.image, placement: b.placement,
        promoCode: b.promoCode, targetTag: b.targetTag, active: true, sort: 0,
        createdById: ownerId,
      },
    });
  }
  console.log(`• ${BANNERS.length} promo banners seeded.`);
}

async function seedOffers(ownerId) {
  const HOUR = 60 * 60 * 1000;
  const OFFERS = [
    { slug: "dragon-fruit",   percentOff: 30, endsInMs: 24 * HOUR },
    { slug: "chinigura-rice", percentOff: 20, endsInMs: 72 * HOUR },
  ];

  let seeded = 0;
  for (const o of OFFERS) {
    const product = await prisma.product.findUnique({ where: { slug: o.slug }, select: { id: true } });
    if (!product) continue;
    await prisma.productOffer.deleteMany({ where: { productId: product.id } });
    await prisma.productOffer.create({
      data: {
        productId: product.id,
        percentOff: o.percentOff,
        endsAt:    new Date(Date.now() + o.endsInMs),
        active:    true,
        createdById: ownerId,
      },
    });
    seeded++;
  }
  console.log(`• ${seeded} Hot Deals offers seeded.`);
}

async function main() {
  const users = await seedUsers();
  const catBySlug = await seedCategories();
  await seedProducts(catBySlug, users.admin.id);
  await seedBanners(users.admin.id);
  await seedOffers(users.admin.id);
  console.log("\nSign in at /login with any of the test accounts above.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
