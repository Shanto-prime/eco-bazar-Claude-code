// prisma/seed.prod.js
// PRODUCTION seed   for the first deploy of a new install. Run once with:
//
//    SEED_ADMIN_EMAIL=you@example.com \
//    SEED_ADMIN_PASSWORD='<strong-password>' \
//    npm run db:seed:prod
//
// What it does:
//   • Creates ONE admin user from the env vars below. Never creates the
//     admin/mod/customer/mamun test accounts that prisma/seed.js does.
//   • Upserts the 12 storefront categories.
//   • Upserts the realistic Bangladeshi organic-grocery catalogue from
//     prisma/seed-data.js (prices in Taka).
//   • Attaches one placeholder image per product. Replace them from
//     /dashboard/products before launch.
//
// Env vars (all read from process.env):
//
//   SEED_ADMIN_EMAIL      (required) The admin's login email.
//   SEED_ADMIN_PASSWORD   (required) Plaintext password. Bcrypt-hashed on write.
//                                    Minimum 8 characters   the seed refuses
//                                    to run below that. Warns below 12.
//   SEED_ADMIN_USERNAME   (optional) Login handle. Defaults to the email's
//                                    local part (before the @).
//   SEED_ADMIN_NAME       (optional) Display name shown in the dashboard.
//
//   SEED_WIPE_EXISTING    (optional) Set to "true" to DELETE every existing
//                                    Product, ProductImage, ProductOffer,
//                                    Review, and PromoBanner before inserting
//                                    the new catalogue. Order rows are
//                                    preserved   OrderItem keeps its
//                                    productName/unitPrice snapshot and its
//                                    productId link becomes null. Set this
//                                    when replacing a demo dataset with the
//                                    real catalogue.
//
// The seed is idempotent for the catalogue side (upsert by slug) and for the
// admin (upsert by email). Running it a second time with the same env vars
// updates password/name/role in place instead of failing.

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("node:fs");
const path = require("node:path");
const {
    CATEGORIES,
    PRODUCTS,
    toCents,
    productImageUrl,
    ratingFor,
} = require("./seed-data");

const IMAGE_DIR = path.join(__dirname, "..", "public", "uploads", "products");

// Primary image + any numbered extras (<slug>-2.jpeg, -3.jpeg, ...).
function galleryFiles(slug) {
    const out = [];
    const primary = path.join(IMAGE_DIR, `${slug}.jpeg`);
    if (fs.existsSync(primary)) {
        out.push({ url: productImageUrl(slug) });
    }
    for (let n = 2; ; n++) {
        const p = path.join(IMAGE_DIR, `${slug}-${n}.jpeg`);
        if (!fs.existsSync(p)) break;
        out.push({ url: `/uploads/products/${slug}-${n}.jpeg` });
    }
    return out;
}

const prisma = new PrismaClient();

function requireEnv(name) {
    const v = process.env[name];
    if (!v || !v.trim()) {
        throw new Error(
            `${name} is required for the production seed.\n` +
                `Usage:\n` +
                `  SEED_ADMIN_EMAIL=you@example.com \\\n` +
                `  SEED_ADMIN_PASSWORD='<strong-password>' \\\n` +
                `  npm run db:seed:prod`,
        );
    }
    return v.trim();
}

function readAdminConfig() {
    const email = requireEnv("SEED_ADMIN_EMAIL").toLowerCase();
    const password = requireEnv("SEED_ADMIN_PASSWORD");
    if (password.length < 8) {
        throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters.");
    }
    if (password.length < 12) {
        console.warn(
            `⚠  SEED_ADMIN_PASSWORD is only ${password.length} characters. ` +
                `Consider a longer passphrase for a production admin.`,
        );
    }

    const usernameEnv = process.env.SEED_ADMIN_USERNAME?.trim();
    const username = (usernameEnv || email.split("@")[0]).toLowerCase();

    const name = process.env.SEED_ADMIN_NAME?.trim() || "Site Admin";

    return { email, password, username, name };
}

async function seedAdmin(cfg) {
    const passwordHash = await bcrypt.hash(cfg.password, 12);

    // Only stamp isSuperAdmin=true if there is no super-admin yet. If someone
    // else already owns that flag we don't yank it away from them silently.
    const existingSuper = await prisma.user.findFirst({
        where: { isSuperAdmin: true },
        select: { id: true, email: true },
    });
    const claimSuper = !existingSuper || existingSuper.email === cfg.email;

    const admin = await prisma.user.upsert({
        where: { email: cfg.email },
        update: {
            username: cfg.username,
            name: cfg.name,
            role: "ADMIN",
            passwordHash,
            ...(claimSuper ? { isSuperAdmin: true } : {}),
        },
        create: {
            email: cfg.email,
            username: cfg.username,
            name: cfg.name,
            role: "ADMIN",
            passwordHash,
            isSuperAdmin: claimSuper,
        },
    });

    console.log(
        `• Admin ${claimSuper ? "(super)" : ""} ready: ${admin.email} (${admin.username})`,
    );
    if (existingSuper && existingSuper.email !== cfg.email) {
        console.log(
            `  Note: super-admin flag stays with ${existingSuper.email}.`,
        );
    }
    return admin;
}

async function wipeExisting() {
    // Order matters only for observability; the schema's Cascade rules would
    // handle the children on Product delete, but doing it in explicit steps
    // gives us a per-table count for the log.
    const offers = await prisma.productOffer.deleteMany({});
    const reviews = await prisma.review.deleteMany({});
    const images = await prisma.productImage.deleteMany({});
    const banners = await prisma.promoBanner.deleteMany({});
    // OrderItem.productId is nullable with onDelete: SetNull, so the historical
    // order snapshot survives   only the product link goes null.
    const products = await prisma.product.deleteMany({});
    console.log(
        `• Wiped existing: ${products.count} products, ${images.count} images, ` +
            `${offers.count} offers, ${reviews.count} reviews, ${banners.count} banners.`,
    );
}

async function seedCategories() {
    const bySlug = {};
    for (const c of CATEGORIES) {
        bySlug[c.slug] = await prisma.category.upsert({
            where: { slug: c.slug },
            update: { name: c.name, icon: c.icon },
            create: { slug: c.slug, name: c.name, icon: c.icon },
        });
    }
    console.log(`• ${CATEGORIES.length} categories seeded.`);
    return bySlug;
}

async function seedProducts(catBySlug, ownerId) {
    for (const p of PRODUCTS) {
        const categoryId = catBySlug[p.category]?.id ?? null;
        if (!categoryId)
            throw new Error(
                `Unknown category "${p.category}" for product "${p.slug}"`,
            );

        const rating = p.rating != null ? p.rating : ratingFor(p.slug);
        const data = {
            name: p.name,
            description: p.description || null,
            price: toCents(p.price),
            oldPrice: p.oldPrice == null ? null : toCents(p.oldPrice),
            badge: p.badge ?? null,
            stock: p.stock,
            brand: p.brand ?? null,
            tags: p.tags ?? [],
            rating,
            categoryId,
        };

        const product = await prisma.product.upsert({
            where: { slug: p.slug },
            update: data,
            create: { ...data, slug: p.slug, createdById: ownerId },
        });

        await prisma.productImage.deleteMany({
            where: { productId: product.id },
        });
        const gallery = galleryFiles(p.slug);
        for (let i = 0; i < gallery.length; i++) {
            await prisma.productImage.create({
                data: {
                    productId: product.id,
                    url: gallery[i].url,
                    alt: p.name,
                    sort: i,
                },
            });
        }
    }
    console.log(`• ${PRODUCTS.length} products seeded.`);
}

async function main() {
    const cfg = readAdminConfig();
    const wipe = process.env.SEED_WIPE_EXISTING === "true";

    const admin = await seedAdmin(cfg);
    if (wipe) await wipeExisting();
    const catBySlug = await seedCategories();
    await seedProducts(catBySlug, admin.id);

    console.log("");
    console.log(
        "Done. Sign in at /login with the SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD.",
    );
    console.log("Next steps:");
    console.log("  • Upload real product photos in /dashboard/products");
    console.log("  • Set up promo banners in /dashboard/banners");
    console.log("  • Configure store currency + rates in /dashboard/settings");
}

main()
    .catch((e) => {
        console.error("\n" + (e?.message || e));
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
