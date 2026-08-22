// prisma/seed.js
// DEV seed   the one npm run db:seed / npx prisma db seed runs.
//
// What it does:
//   1. Upserts the four DEMO users (login with the username OR email + password):
//        test-admin / test-admin@shanto.dev / test-admin / ADMIN
//        mod        / test-mod@dhanto.dev   / moderator  / MODERATOR
//        customer   / customer@shanto.dev   / customer   / CUSTOMER
//        customer-2 / customer2@shanto.dev  / customer-2 / CUSTOMER
//      These four accounts are read-only: every mutating server action is
//      blocked by assertNotDemo() in lib/demo-accounts.js. Newly-signed-up
//      accounts (or admins created by the super-admin) are NOT demo — they
//      work normally.
//   1b. If SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are set in the process
//       env (typically via .env.local, which is gitignored), upserts THAT
//       user as the real super-admin (isSuperAdmin=true, not a demo account,
//       full permissions). Any prior super-admin is demoted so exactly one
//       exists. Skipped silently when the env vars aren't set.
//   2. Upserts the 12 categories + realistic product catalogue from
//      prisma/seed-data.js (Bangladeshi organic-grocery items, prices in Taka).
//   3. Attaches one placeholder image per product (deterministic URL from
//      seed-data.js `img()`).
//   4. Seeds two promo banners (TOP + BELOW_LIST) using storefront hero images.
//   5. Seeds two live Hot Deals offers on catalogue products.
//
// The seed is idempotent   every write uses upsert (or delete-then-create for
// images/offers) so re-running never duplicates rows. Old products left over
// from previous seed runs are NOT deleted here; use prisma/seed.prod.js with
// SEED_WIPE_EXISTING=true (or the /dashboard/products UI) to clean those up.
//
// For a production install, don't run this. Use prisma/seed.prod.js instead
// it takes admin credentials from env vars and never creates test accounts.

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

// Four seeded dev / demo accounts. Every one of these is a DEMO account —
// they can browse and place orders, but every mutating server action is
// blocked with a "This is a demo account" error (see lib/demo-accounts.js).
// The DEMO_EMAILS set there must stay in sync with the emails below.
//
// Old accounts from previous seed versions (admin@ecobazar.test, mod@…,
// customer@…, mamun@…) are deleted before the upsert to avoid username
// uniqueness collisions with the fresh accounts.
const OLD_TEST_EMAILS = [
    "admin@ecobazar.test",
    "mod@ecobazar.test",
    "customer@ecobazar.test",
    "mamun@ecobazar.test",
    // Also the previous 3-account revision, just in case the seed was run
    // once with those emails.
    "test-user@shanto.dev",
];
const DEV_USERS = [
    {
        username: "test-admin",
        email: "test-admin@shanto.dev",
        password: "test-admin",
        role: "ADMIN",
        name: "test-admin",
        // Demo admin — public-facing account used by recruiters / demo
        // viewers. Deliberately NOT the super admin: the super admin is
        // provisioned separately via SEED_ADMIN_* env vars so its
        // credentials never enter the repo. See seedSuperAdmin() below.
        isSuperAdmin: false,
    },
    {
        username: "mod",
        email: "test-mod@dhanto.dev",
        password: "moderator",
        role: "MODERATOR",
        name: "test-mod",
        isSuperAdmin: false,
    },
    {
        username: "customer",
        email: "customer@shanto.dev",
        password: "customer",
        role: "CUSTOMER",
        name: "customer",
        isSuperAdmin: false,
    },
    {
        username: "customer-2",
        email: "customer2@shanto.dev",
        password: "customer-2",
        role: "CUSTOMER",
        name: "customer-2",
        isSuperAdmin: false,
    },
];

async function seedUsers() {
    // Rename any stale users from previous seed versions BEFORE the new upsert
    // — an in-place rename avoids two problems at once: (a) the unique index
    // on `username`/`email` would collide if we tried to create fresh
    // accounts alongside the old ones, and (b) deleting old users first fails
    // with P2014 whenever they created products (Product.createdBy is a
    // required relation).
    //
    // "Rename" here = suffix a marker on the old email/username so they
    // still resolve uniquely but no longer clash with the fresh accounts.
    // Products they created stay with them, orders keep their `userId`, and
    // the accounts become inert (the passwords still work but they aren't
    // demo accounts any more).
    const stalePairs = [
        { oldEmail: "admin@ecobazar.test",    stashPrefix: "stale-admin"    },
        { oldEmail: "mod@ecobazar.test",      stashPrefix: "stale-mod"      },
        { oldEmail: "customer@ecobazar.test", stashPrefix: "stale-customer" },
        { oldEmail: "mamun@ecobazar.test",    stashPrefix: "stale-mamun"    },
        { oldEmail: "test-user@shanto.dev",   stashPrefix: "stale-testuser" },
    ];
    let renamed = 0;
    for (const { oldEmail, stashPrefix } of stalePairs) {
        const existing = await prisma.user.findUnique({
            where:  { email: oldEmail },
            select: { id: true, username: true },
        });
        if (!existing) continue;
        // Suffix with the user's cuid so re-runs don't collide with the
        // renamed row from a previous re-run.
        const suffix = existing.id.slice(-6);
        await prisma.user.update({
            where: { id: existing.id },
            data: {
                email:        `${stashPrefix}-${suffix}@stale.local`,
                username:     `${stashPrefix}-${suffix}`,
                isSuperAdmin: false,
            },
        });
        renamed++;
    }
    if (renamed > 0) {
        console.log(`• Renamed ${renamed} stale user(s) from previous seeds (kept intact, no longer clash).`);
    }

    const created = {};
    for (const u of DEV_USERS) {
        const passwordHash = await bcrypt.hash(u.password, 12);
        created[u.username] = await prisma.user.upsert({
            where: { email: u.email },
            update: {
                username: u.username,
                role: u.role,
                passwordHash,
                name: u.name,
                isSuperAdmin: u.isSuperAdmin,
            },
            create: {
                username: u.username,
                email: u.email,
                name: u.name,
                role: u.role,
                passwordHash,
                isSuperAdmin: u.isSuperAdmin,
            },
        });
    }
    console.log("• Demo users (username / email / password):");
    for (const u of DEV_USERS) {
        console.log(
            `    ${u.username.padEnd(12)} / ${u.email.padEnd(24)} / ${u.password}  (${u.role})`,
        );
    }
    console.log("  [read-only — every mutating action returns a demo-account error]");
    return created;
}

// Provisions the REAL super admin from env vars (SEED_ADMIN_EMAIL,
// SEED_ADMIN_PASSWORD, optionally SEED_ADMIN_USERNAME + SEED_ADMIN_NAME).
// Skipped silently when the vars aren't set — that lets the seed keep working
// out of the box for someone who just cloned the repo, without a fallback
// password ever landing in git.
//
// When it runs, it enforces "exactly one super admin": the target user is
// upserted with isSuperAdmin=true and any OTHER user that happens to still
// hold the flag (e.g. from an older seed) is demoted to a plain admin. The
// target user is guaranteed NOT to be one of the demo emails — that would
// defeat the point (every mutation would be blocked).
async function seedRealSuperAdmin() {
    const email    = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) {
        console.log(
            "• Real super admin: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipped.",
        );
        console.log(
            "  Put them in .env.local (gitignored) to provision your own super admin on the next seed run.",
        );
        return null;
    }

    // A demo email as the super admin would immediately block itself via
    // assertNotDemo — refuse to write, tell the user why.
    const { DEMO_EMAILS } = require("../lib/demo-accounts");
    if (DEMO_EMAILS.has(email)) {
        console.warn(
            `• Real super admin: refusing to promote ${email} — it's on the DEMO_EMAILS list, so every mutation would be blocked. Use a different email.`,
        );
        return null;
    }

    if (password.length < 8) {
        console.warn(
            `• Real super admin: SEED_ADMIN_PASSWORD is too short (${password.length} chars, needs ≥ 8). Skipped.`,
        );
        return null;
    }
    if (password.length < 12) {
        console.warn(
            `⚠  SEED_ADMIN_PASSWORD is only ${password.length} chars — 12+ recommended for a super admin.`,
        );
    }

    const rawUsername = process.env.SEED_ADMIN_USERNAME?.trim();
    const username = (rawUsername || email.split("@")[0]).toLowerCase();
    const name     = process.env.SEED_ADMIN_NAME?.trim() || "Super Admin";
    const passwordHash = await bcrypt.hash(password, 12);

    // Demote any OTHER super admin first, so the invariant "exactly one" holds.
    // Lets the target user upsert cleanly whether they existed or not.
    const demoted = await prisma.user.updateMany({
        where: { isSuperAdmin: true, email: { not: email } },
        data:  { isSuperAdmin: false },
    });
    if (demoted.count > 0) {
        console.log(
            `  Demoted ${demoted.count} prior super-admin(s) so only the SEED_ADMIN_* one holds the flag.`,
        );
    }

    const admin = await prisma.user.upsert({
        where:  { email },
        update: { username, name, role: "ADMIN", passwordHash, isSuperAdmin: true },
        create: { username, email, name, role: "ADMIN", passwordHash, isSuperAdmin: true },
    });

    console.log(
        `• Real super admin ready: ${admin.email} (${admin.username})  [private — not in the 4 demo accounts]`,
    );
    return admin;
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
    let withImage = 0;
    let noImage = 0;
    const missing = [];
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

        // Attach the primary photo + any numbered gallery extras. Products
        // without any file stay image-less so the storefront's ProductCard
        // shows a placeholder instead of a broken image.
        await prisma.productImage.deleteMany({
            where: { productId: product.id },
        });
        const gallery = galleryFiles(p.slug);
        if (gallery.length === 0) {
            noImage++;
            missing.push(p.slug);
            continue;
        }
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
        withImage++;
        if (gallery.length > 1)
            console.log(`  ${p.slug}: ${gallery.length}-image gallery`);
    }
    console.log(
        `• ${PRODUCTS.length} products seeded (${withImage} with real photo, ${noImage} image-less).`,
    );
    if (missing.length) console.log(`  Image-less: ${missing.join(", ")}`);
}

async function seedBanners(ownerId) {
    const BANNERS = [
        {
            slug: "seasonal-picks",
            title: "Seasonal picks   up to 25% off",
            placement: "TOP",
            image: "/images/hero-summer.jpg",
            promoCode: "SEASON25",
            targetTag: "seasonal",
        },
        {
            slug: "premium-selection",
            title: "Premium selection   Hilsa, Sundarban honey & more",
            placement: "BELOW_LIST",
            image: "/images/banner-37off.jpg",
            promoCode: "PREMIUM",
            targetTag: "premium",
        },
    ];
    for (const b of BANNERS) {
        await prisma.promoBanner.upsert({
            where: { slug: b.slug },
            update: {
                title: b.title,
                imageUrl: b.image,
                placement: b.placement,
                promoCode: b.promoCode,
                targetTag: b.targetTag,
                active: true,
            },
            create: {
                slug: b.slug,
                title: b.title,
                imageUrl: b.image,
                placement: b.placement,
                promoCode: b.promoCode,
                targetTag: b.targetTag,
                active: true,
                sort: 0,
                createdById: ownerId,
            },
        });
    }
    console.log(`• ${BANNERS.length} promo banners seeded.`);
}

async function seedOffers(ownerId) {
    const HOUR = 60 * 60 * 1000;
    const OFFERS = [
        { slug: "dragon-fruit", percentOff: 30, endsInMs: 24 * HOUR },
        { slug: "chinigura-rice", percentOff: 20, endsInMs: 72 * HOUR },
    ];

    let seeded = 0;
    for (const o of OFFERS) {
        const product = await prisma.product.findUnique({
            where: { slug: o.slug },
            select: { id: true },
        });
        if (!product) continue;
        await prisma.productOffer.deleteMany({
            where: { productId: product.id },
        });
        await prisma.productOffer.create({
            data: {
                productId: product.id,
                percentOff: o.percentOff,
                endsAt: new Date(Date.now() + o.endsInMs),
                active: true,
                createdById: ownerId,
            },
        });
        seeded++;
    }
    console.log(`• ${seeded} Hot Deals offers seeded.`);
}

async function main() {
    const users = await seedUsers();
    // Real super admin (private, env-var driven). Runs after the demo users
    // so the "demote any other super admin" sweep can safely target the
    // test-admin row from the previous seed version.
    const superAdmin = await seedRealSuperAdmin();
    const catBySlug = await seedCategories();
    // Ownership of seed-created products/banners/offers goes to the real
    // super admin when available; falls back to test-admin so a fresh clone
    // (with no SEED_ADMIN_* env) still boots with a valid createdById.
    const ownerId = superAdmin?.id || users["test-admin"].id;
    await seedProducts(catBySlug, ownerId);
    await seedBanners(ownerId);
    await seedOffers(ownerId);
    console.log("\nSign in at /login with any of the test accounts above.");
    if (superAdmin) {
        console.log("Your real super admin (from SEED_ADMIN_*): " + superAdmin.email);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
