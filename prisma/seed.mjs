// prisma/seed.mjs
// Seed the database with:
//   1. An admin user (admin@ecobazar.test  / password: admin12345)
//   2. A moderator user (mod@ecobazar.test / password: mod12345)
//   3. The 10 products previously defined in lib/data.js as static data.
//
// Run with:    npm run db:seed
// Idempotent:  re-running won't duplicate; uses `upsert` everywhere.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

async function main() {
  // ---- Users -----------------------------------------------------------------
  const adminHash = await bcrypt.hash("admin12345", 10);
  const modHash   = await bcrypt.hash("mod12345",   10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ecobazar.test" },
    update: { role: "ADMIN", passwordHash: adminHash },
    create: { email: "admin@ecobazar.test", name: "Site Admin", role: "ADMIN", passwordHash: adminHash },
  });
  const moderator = await prisma.user.upsert({
    where: { email: "mod@ecobazar.test" },
    update: { role: "MODERATOR", passwordHash: modHash },
    create: { email: "mod@ecobazar.test", name: "Demo Moderator", role: "MODERATOR", passwordHash: modHash },
  });

  console.log("• Users  : admin@ecobazar.test (admin12345)  •  mod@ecobazar.test (mod12345)");

  // ---- Products --------------------------------------------------------------
  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name:     p.name,
        price:    p.price,
        oldPrice: p.oldPrice,
        badge:    p.badge,
        stock:    p.stock,
      },
      create: {
        slug:        p.slug,
        name:        p.name,
        description: DEFAULT_DESC,
        price:       p.price,
        oldPrice:    p.oldPrice,
        badge:       p.badge,
        stock:       p.stock,
        rating:      4,
        createdById: admin.id,
      },
    });
  }
  console.log(`• ${PRODUCTS.length} products seeded.`);
  console.log("");
  console.log("Sign in to the admin panel at /admin/login with:");
  console.log("  admin@ecobazar.test  /  admin12345   (admin — full access)");
  console.log("  mod@ecobazar.test    /  mod12345     (moderator — limited)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
