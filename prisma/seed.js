// prisma/seed.js
// Seed the MongoDB database with:
//   1. Test users (login with the username OR the email + password):
//        admin    / admin@ecobazar.test    / admin    / ADMIN
//        mod      / mod@ecobazar.test      / mod      / MODERATOR
//        customer / customer@ecobazar.test / customer / CUSTOMER
//        mamun    / mamun@ecobazar.test    / mamun    / CUSTOMER
//   2. The storefront CATEGORIES (from lib/data.js).
//   3. The 10 starter products, each assigned to a category.
//   4. DEMO products (no image) for any category that would otherwise be empty,
//      so every category shows something in the shop. Admin can add images to
//      these later from the dashboard.
//
// Run with:    npx prisma db seed   (or: npm run db:seed)
// Idempotent:  re-running won't duplicate; uses `upsert` everywhere.

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Prices below are written in DOLLARS for readability; the DB stores integer
// cents (see lib/money.js), so we convert on the way in.
const toCents = (dollars) => Math.round(Number(dollars) * 100);

// The 12 storefront categories (kept in sync with lib/data.js `categories`).
const CATEGORIES = [
  { slug: "fresh-fruit",      name: "Fresh Fruit",     icon: "🍍" },
  { slug: "fresh-vegetables", name: "Fresh Vegetables", icon: "🥦" },
  { slug: "meat-fish",        name: "Meat & Fish",     icon: "🍖" },
  { slug: "snacks",           name: "Snacks",          icon: "🍪" },
  { slug: "beverages",        name: "Beverages",       icon: "🥤" },
  { slug: "beauty-health",    name: "Beauty & Health", icon: "🧴" },
  { slug: "bread-bakery",     name: "Bread & Bakery",  icon: "🥖" },
  { slug: "baking-needs",     name: "Baking Needs",    icon: "🥚" },
  { slug: "cooking",          name: "Cooking",         icon: "🍳" },
  { slug: "diabetic-food",    name: "Diabetic Food",   icon: "🥗" },
  { slug: "dish-detergents",  name: "Dish Detergents", icon: "🧼" },
  { slug: "oil",              name: "Oil",             icon: "🛢️" },
];

// Each real product is assigned to a category so category filtering works.
const PRODUCTS = [
  { slug: "green-apple",        name: "Green Apple",         category: "fresh-fruit",      price: 14.99, oldPrice: 20.99, badge: "Sale 50%", stock: 50,  image: "/images/prod1.jpg" },
  { slug: "fresh-indian-malta", name: "Fresh Indian Malta",  category: "fresh-fruit",      price: 20.00, stock: 40,  image: "/images/prod2.jpg" },
  { slug: "chinese-cabbage",    name: "Chinese cabbage",     category: "fresh-vegetables", price: 12.00, stock: 100, image: "/images/prod3.jpg" },
  { slug: "green-lettuce",      name: "Green Lettuce",       category: "fresh-vegetables", price:  9.00, stock: 80,  image: "/images/prod4.jpg" },
  { slug: "eggplant",           name: "Eggplant",            category: "fresh-vegetables", price: 34.00, stock: 25,  image: "/images/prod5.jpg" },
  { slug: "big-potatoes",       name: "Big Potatoes",        category: "fresh-vegetables", price: 20.00, stock: 200, image: "/images/prod6.jpg" },
  { slug: "corn",               name: "Corn",                category: "fresh-vegetables", price: 20.00, stock: 60,  image: "/images/prod7.jpg" },
  { slug: "fresh-cauliflower",  name: "Fresh Cauliflower",   category: "fresh-vegetables", price: 12.00, stock: 40,  image: "/images/prod8.jpg" },
  { slug: "green-capsicum",     name: "Green Capsicum",      category: "fresh-vegetables", price:  9.00, oldPrice: 20.99, badge: "Sale 50%", stock: 70, image: "/images/prod9.jpg" },
  { slug: "green-chili",        name: "Green Chili",         category: "fresh-vegetables", price: 34.00, stock: 30,  image: "/images/prod10.jpg" },
];

const DEFAULT_DESC =
  "Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. " +
  "Fresh, organically grown produce delivered to your door.";

const TEST_USERS = [
  { username: "admin",    email: "admin@ecobazar.test",    password: "admin",    role: "ADMIN",     name: "Site Admin" },
  { username: "mod",      email: "mod@ecobazar.test",      password: "mod",      role: "MODERATOR", name: "Demo Moderator" },
  { username: "customer", email: "customer@ecobazar.test", password: "customer", role: "CUSTOMER",  name: "Demo Customer" },
  // Second customer for testing (auto-generated details).
  { username: "mamun",    email: "mamun@ecobazar.test",    password: "mamun",    role: "CUSTOMER",  name: "Mamun" },
];

async function main() {
  // ---- Users ---------------------------------------------------------------
  const created = {};
  for (const u of TEST_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    // The seeded `admin` is the super admin (founding account — never
    // deletable/demotable). Everyone else is a normal account.
    const isSuperAdmin = u.username === "admin";
    created[u.role] = await prisma.user.upsert({
      where:  { username: u.username },
      update: { email: u.email, role: u.role, passwordHash, name: u.name, isSuperAdmin },
      create: { username: u.username, email: u.email, name: u.name, role: u.role, passwordHash, isSuperAdmin },
    });
  }

  console.log("• Users (username / email / password):");
  for (const u of TEST_USERS) {
    console.log(`    ${u.username.padEnd(10)} / ${u.email.padEnd(24)} / ${u.password}  (${u.role})`);
  }

  // ---- Categories ----------------------------------------------------------
  const catBySlug = {};
  for (const c of CATEGORIES) {
    catBySlug[c.slug] = await prisma.category.upsert({
      where:  { slug: c.slug },
      update: { name: c.name, icon: c.icon },
      create: { slug: c.slug, name: c.name, icon: c.icon },
    });
  }
  console.log(`• ${CATEGORIES.length} categories seeded.`);

  // ---- Products ------------------------------------------------------------
  const owner = created.ADMIN;
  for (const p of PRODUCTS) {
    const categoryId = p.category ? catBySlug[p.category]?.id ?? null : null;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name:     p.name,
        price:    toCents(p.price),
        oldPrice: p.oldPrice == null ? null : toCents(p.oldPrice),
        badge:    p.badge ?? null,
        stock:    p.stock,
        categoryId,
      },
      create: {
        slug:          p.slug,
        name:          p.name,
        description:   DEFAULT_DESC,
        price:         toCents(p.price),
        oldPrice:      p.oldPrice == null ? null : toCents(p.oldPrice),
        badge:         p.badge ?? null,
        stock:         p.stock,
        rating:        4,
        categoryId,
        createdById:   owner.id,
      },
    });

    // Attach the demo product image (idempotent: reset to exactly one image).
    if (p.image) {
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.create({ data: { productId: product.id, url: p.image, alt: p.name, sort: 0 } });
    }
  }
  console.log(`• ${PRODUCTS.length} products seeded.`);

  // ---- Demo products for empty categories ----------------------------------
  // Any category with no products yet gets 3 placeholder products (NO image —
  // the admin adds real photos + prices later). This guarantees every category
  // in the shop shows something instead of an empty grid.
  let demoTotal = 0;
  for (const c of CATEGORIES) {
    const count = await prisma.product.count({ where: { categoryId: catBySlug[c.slug].id } });
    if (count > 0) continue;

    for (let i = 1; i <= 3; i++) {
      const slug = `demo-${c.slug}-${i}`;
      await prisma.product.upsert({
        where:  { slug },
        update: { name: `${c.name} Demo ${i}`, categoryId: catBySlug[c.slug].id },
        create: {
          slug,
          name:        `${c.name} Demo ${i}`,
          description: `Placeholder product in ${c.name}. Add a real image and details from the dashboard.`,
          // Modest placeholder price (in DOLLARS → cents). Vary a little by i.
          price:       toCents(4.99 + i),
          stock:       25,
          rating:      0,
          badge:       "Demo",
          categoryId:  catBySlug[c.slug].id,
          createdById: owner.id,
          // No ProductImage rows → the card/gallery falls back to a placeholder.
        },
      });
      demoTotal++;
    }
  }
  console.log(`• ${demoTotal} demo products seeded (image-less, for empty categories).`);

  // ---- Promo banners -------------------------------------------------------
  // One example banner per placement, reusing existing storefront images, so the
  // promo areas are populated and immediately editable in the dashboard. Each
  // targets the "Sale 50%" badge → its /deals/<slug> page lists those products.
  // NOTE: there is deliberately no HOT_DEALS banner here. That area is no longer
  // image-driven — it is filled by ProductOffer rows (seeded just below), so a
  // HOT_DEALS banner would be stored and never rendered.
  const BANNERS = [
    { slug: "summer-sale", title: "Summer Sale — up to 50% off", placement: "TOP",        image: "/images/hero-summer.jpg",  promoCode: "SUMMER25", targetTag: "Sale 50%" },
    { slug: "top-deals",   title: "Top Deals of the Week",       placement: "BELOW_LIST", image: "/images/banner-37off.jpg", promoCode: "SAVE37",   targetTag: "Sale 50%" },
  ];
  for (const b of BANNERS) {
    await prisma.promoBanner.upsert({
      where:  { slug: b.slug },
      update: { title: b.title, imageUrl: b.image, placement: b.placement, promoCode: b.promoCode, targetTag: b.targetTag, active: true },
      create: {
        slug: b.slug, title: b.title, imageUrl: b.image, placement: b.placement,
        promoCode: b.promoCode, targetTag: b.targetTag, active: true, sort: 0,
        createdById: owner.id,
      },
    });
  }
  console.log(`• ${BANNERS.length} promo banners seeded (one per image placement).`);

  // ---- Hot Deals offers ----------------------------------------------------
  // Timed percentage discounts on real products — this is what fills the
  // storefront's Hot Deals area. Two offers with different deadlines so the
  // ordering is visible immediately: the soonest-ending one takes the big
  // featured card, the other becomes a small card.
  //
  // While an offer is live it is the product's real selling price everywhere
  // (see lib/offers.js), so these also demonstrate the struck-through pricing.
  const HOUR = 60 * 60 * 1000;
  const OFFERS = [
    { slug: "green-apple",     percentOff: 50, endsInMs: 24 * HOUR },
    { slug: "chinese-cabbage", percentOff: 25, endsInMs: 72 * HOUR },
  ];

  let offersSeeded = 0;
  for (const o of OFFERS) {
    const product = await prisma.product.findUnique({ where: { slug: o.slug }, select: { id: true } });
    if (!product) continue; // catalogue changed — skip rather than fail the seed

    // Only one live offer per product is allowed (enforced in the dashboard
    // actions), so clear any previous rows before inserting. Keeps re-seeding
    // idempotent; ProductOffer has no natural unique key to upsert on.
    await prisma.productOffer.deleteMany({ where: { productId: product.id } });
    await prisma.productOffer.create({
      data: {
        productId:   product.id,
        percentOff:  o.percentOff,
        endsAt:      new Date(Date.now() + o.endsInMs),
        active:      true,
        createdById: owner.id,
      },
    });
    offersSeeded++;
  }
  console.log(`• ${offersSeeded} Hot Deals offers seeded (soonest-ending takes the featured card).`);

  console.log("");
  console.log("Sign in at /login with any of the test accounts above.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
