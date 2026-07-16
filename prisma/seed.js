// prisma/seed.js
// Seed the MongoDB database with:
//   1. Three test users (login with the username OR the email + password):
//        admin    / admin@ecobazar.test    / admin    / ADMIN
//        mod      / mod@ecobazar.test      / mod      / MODERATOR
//        customer / customer@ecobazar.test / customer / CUSTOMER
//      Each user now has a distinct `username` (login handle) and a real
//      `email` (used for password reset / verification).
//   2. The 10 starter products previously defined in lib/data.js.
//
// Run with:    npx prisma db seed   (or: npm run db:seed)
// Idempotent:  re-running won't duplicate; uses `upsert` everywhere.

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Prices below are written in DOLLARS for readability; the DB stores integer
// cents (see lib/money.js), so we convert on the way in.
const toCents = (dollars) => Math.round(Number(dollars) * 100);

const PRODUCTS = [
  { slug: "green-apple",        name: "Green Apple",         price: 14.99, oldPrice: 20.99, badge: "Sale 50%", stock: 50 },
  { slug: "fresh-indian-malta", name: "Fresh Indian Malta",  price: 20.00, stock: 40 },
  { slug: "chinese-cabbage",    name: "Chinese cabbage",     price: 12.00, stock: 100 },
  { slug: "green-lettuce",      name: "Green Lettuce",       price:  9.00, stock: 80 },
  { slug: "eggplant",           name: "Eggplant",            price: 34.00, stock: 25 },
  { slug: "big-potatoes",       name: "Big Potatoes",        price: 20.00, stock: 200 },
  { slug: "corn",               name: "Corn",                price: 20.00, stock: 60 },
  { slug: "fresh-cauliflower",  name: "Fresh Cauliflower",   price: 12.00, stock: 40 },
  { slug: "green-capsicum",     name: "Green Capsicum",      price:  9.00, oldPrice: 20.99, badge: "Sale 50%", stock: 70 },
  { slug: "green-chili",        name: "Green Chili",         price: 34.00, stock: 30 },
];

const DEFAULT_DESC =
  "Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. " +
  "Fresh, organically grown produce delivered to your door.";

const TEST_USERS = [
  { username: "admin",    email: "admin@ecobazar.test",    password: "admin",    role: "ADMIN",     name: "Site Admin" },
  { username: "mod",      email: "mod@ecobazar.test",      password: "mod",      role: "MODERATOR", name: "Demo Moderator" },
  { username: "customer", email: "customer@ecobazar.test", password: "customer", role: "CUSTOMER",  name: "Demo Customer" },
];

async function main() {
  // ---- Users ---------------------------------------------------------------
  const created = {};
  for (const u of TEST_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    created[u.role] = await prisma.user.upsert({
      where:  { username: u.username },
      update: { email: u.email, role: u.role, passwordHash, name: u.name },
      create: { username: u.username, email: u.email, name: u.name, role: u.role, passwordHash },
    });
  }

  console.log("• Users (username / email / password):");
  for (const u of TEST_USERS) {
    console.log(`    ${u.username.padEnd(10)} / ${u.email.padEnd(24)} / ${u.password}  (${u.role})`);
  }

  // ---- Products ------------------------------------------------------------
  const owner = created.ADMIN;
  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name:     p.name,
        price:    toCents(p.price),
        oldPrice: p.oldPrice == null ? null : toCents(p.oldPrice),
        badge:    p.badge ?? null,
        stock:    p.stock,
      },
      create: {
        slug:        p.slug,
        name:        p.name,
        description: DEFAULT_DESC,
        price:       toCents(p.price),
        oldPrice:    p.oldPrice == null ? null : toCents(p.oldPrice),
        badge:       p.badge ?? null,
        stock:       p.stock,
        rating:      4,
        createdById: owner.id,
      },
    });
  }
  console.log(`• ${PRODUCTS.length} products seeded.`);
  console.log("");
  console.log("Sign in at /login with any of the three test accounts above.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
