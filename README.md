# Ecobazar — Next.js App

Next.js 16 (App Router) + React 19 e-commerce store for organic groceries.
Tailwind CSS v4, Prisma + **MongoDB**, NextAuth v5 (credentials + optional
Google/Facebook), role-based `/dashboard` on the same domain as the storefront.

> **MongoDB must run as a replica set.** Checkout decrements stock inside a
> `prisma.$transaction`, and the Prisma MongoDB connector cannot run multi-document
> transactions against a standalone `mongod`. Use Atlas (a replica set by default),
> or a local single-node replica set: add `?replicaSet=rs0` to `DATABASE_URL` and
> run `rs.initiate()` once.

---

## Run it

```bash
npm install                       # postinstall runs `prisma generate`

cp .env.example .env.local        # fill in DATABASE_URL + NEXTAUTH_SECRET

npm run db:push                   # sync the schema (MongoDB has no migrations)
npm run db:seed                   # 4 test users, categories, 10 products, banners

npm run dev                       # http://localhost:3000
```

`npm run db:migrate` exists but **does not work on MongoDB** — Prisma has no
migration history for this connector. Always use `npm run db:push`.

### Test accounts

Sign in at `/login` with **either the username or the email**, plus the password:

| Username   | Email                    | Password   | Role      |
|------------|--------------------------|------------|-----------|
| `admin`    | `admin@ecobazar.test`    | `admin`    | ADMIN     |
| `mod`      | `mod@ecobazar.test`      | `mod`      | MODERATOR |
| `customer` | `customer@ecobazar.test` | `customer` | CUSTOMER  |
| `mamun`    | `mamun@ecobazar.test`    | `mamun`    | CUSTOMER  |

`admin` is seeded as the **super admin** (`User.isSuperAdmin`) and can never be
demoted or deleted by anyone. Outside production the login form renders
quick-fill buttons for these accounts so you don't have to type them.

Identity model: `username` is a unique login handle and is **nullable** (OAuth
users have none); `email` is unique and required, and is what password reset and
verification use. A verification email is issued at signup but is **not**
enforced at login.

---

## Route map

| URL                            | Access                                   |
|--------------------------------|------------------------------------------|
| `/`                            | public                                   |
| `/shop`                        | public                                   |
| `/shop/[slug]`                 | public — product detail                  |
| `/deals/[slug]`                | public — promo landing page              |
| `/cart`                        | public                                   |
| `/checkout`                    | public (guest checkout allowed)          |
| `/contact`                     | public                                   |
| `/login`, `/register`          | public                                   |
| `/forgot-password`             | public                                   |
| `/reset-password`              | public (needs a `?token=`)               |
| `/unauthorized`                | public — shown when blocked              |
| `/wishlist`                    | **signed in** — per-user, stored in DB   |
| `/dashboard`                   | any authenticated user (role router)     |
| `/dashboard/orders`            | any auth user (data scoped by role)      |
| `/dashboard/settings`          | any auth user (own account only)         |
| `/dashboard/products`          | ADMIN + MODERATOR                        |
| `/dashboard/products/new`      | ADMIN + MODERATOR                        |
| `/dashboard/products/[id]/edit`| ADMIN + MODERATOR (mods: own only)       |
| `/dashboard/reviews`           | ADMIN + MODERATOR                        |
| `/dashboard/users`             | ADMIN only                               |
| `/dashboard/banners`           | ADMIN only — banners + Hot Deals offers  |
| `/dashboard/approvals`         | ADMIN only — moderator request queue     |
| `/dashboard/profile-requests`  | ADMIN only — email/phone change queue     |
| `/dashboard/audit-log`         | ADMIN only                               |

### API routes

| URL                          | Access                        |
|------------------------------|-------------------------------|
| `/api/auth/[...nextauth]`    | NextAuth handlers             |
| `/api/auth/signup`           | public (rate-limited)         |
| `/api/auth/forgot-password`  | public (never reveals if an account exists) |
| `/api/auth/reset-password`   | public (one-time token)       |
| `/api/auth/verify`           | public (one-time token)       |
| `/api/products`              | public — search/pagination     |
| `/api/upload`                | ADMIN + MODERATOR — product images |
| `/api/upload/avatar`         | any signed-in user            |
| `/api/upload/banner`         | ADMIN only                    |

---

## Authorization — three enforcement layers

Access control is deliberately layered; **do not rely on any single layer**:

1. **`middleware.js`** — matches `/dashboard/*` and `/wishlist*` only. It knows
   *signed in or not*, nothing more: anonymous `/dashboard` requests go to
   `/unauthorized?next=...`, anonymous `/wishlist` to `/login?next=...`. It runs
   on the Edge runtime and is built from the edge-safe `auth.config.js`, so
   Prisma and bcrypt never enter the middleware bundle.
2. **Server components / pages** — call `requireRole(...)` / `requireAuth(...)`
   from `lib/auth-helpers.js` to enforce the actual role per route.
3. **Server actions & API routes** — re-check the role again, even though the
   route is already protected.

`session.user` carries `id` and `role`, threaded through the JWT so role checks
don't hit the DB on a normal request. The JWT re-reads the role from the DB every
5 minutes (`ROLE_TTL_MS` in `lib/auth.js`) so a promotion or demotion can't stay
stale for a whole token lifetime.

**Moderator ownership rule:** MODERATORs may create products, but may only
edit/delete products where `Product.createdById === user.id`. ADMIN can edit any.
Enforced in the server actions, not the schema.

**Approval queue:** actions a moderator may not perform directly become a PENDING
`ApprovalRequest` for an admin to approve or reject — currently `PRODUCT_DELETE`
and `ORDER_CANCEL`. On approval the admin performs the real action.

**Every privileged write appends an `AuditLog` row** (`actorId`, `action`,
`entity`, `entityId`, `metadata`). Follow the existing pattern when adding a
mutating action.

**Session timeout:** sessions expire on *inactivity* — 6 h for customers, 12 h for
admins/moderators (`lib/session-policy.js`). The JWT carries a rolling
`lastActivityAt`; past the limit the token's identity is stripped.

---

## Project layout

```
ecobazar-next/
├── app/
│   ├── layout.js               root chrome + Theme/Language/Currency/Cart providers
│   ├── page.js                 home (incl. the Hot Deals area)
│   ├── shop/, shop/[slug]/     listing + product detail
│   ├── deals/[slug]/           promo landing page
│   ├── cart/, checkout/, wishlist/, contact/
│   ├── login/, register/, forgot-password/, reset-password/
│   ├── unauthorized/
│   ├── dashboard/              role-routed admin/mod/customer area
│   │   ├── page.jsx            branches on session.user.role
│   │   ├── _components/        Admin/Moderator/CustomerDashboard, DashboardShell
│   │   ├── products/           ADMIN + MODERATOR (+ _actions.js, _form/)
│   │   ├── orders/             all roles, scoped server-side
│   │   ├── offers/             Hot Deals offer actions + ProductPicker/OfferForm
│   │   ├── banners/            ADMIN — image banners AND Hot Deals offers
│   │   ├── approvals/          ADMIN — moderator request queue
│   │   ├── profile-requests/   ADMIN — email/phone change queue
│   │   ├── settings/           own account (profile, password, addresses, currency)
│   │   ├── reviews/, users/, audit-log/
│   └── api/                    auth, products, upload (products/avatar/banner)
├── components/                 shared UI (ProductCard, HomeHotDealsCard, …)
├── lib/
│   ├── auth.js                 Node NextAuth config (Prisma + bcrypt + events)
│   ├── auth-helpers.js         getCurrentUser / requireAuth / requireRole
│   ├── session-policy.js       edge-safe idle-timeout rules
│   ├── prisma.js               PrismaClient singleton
│   ├── products-db.js          DB reads for customer pages; shape() + offer price
│   ├── offers.js               Hot Deals offer rules + discount maths
│   ├── money.js                cents ↔ dollars boundary
│   ├── currency/, i18n/, theme/  providers + server-side cookie reads
│   ├── order-actions.js        placeOrderAction (atomic inventory, real prices)
│   ├── order-status.js         OrderStatus list + presentation
│   ├── inventory.js            restock on cancel
│   ├── cart-actions.js         server-side cart (logged-in users)
│   ├── CartContext.jsx         cart/wishlist/toast state
│   ├── upload.js               shared image-upload validation
│   ├── tokens.js, mailer.js    reset/verify tokens + mail transport
│   ├── rate-limit.js           in-memory fixed-window limiter
│   ├── banners.js, bd-geo.js, store-config.js, profile-changes.js, user-service.js
│   └── data.js                 static starter catalogue — SEED INPUT ONLY
├── prisma/
│   ├── schema.prisma           mongodb provider
│   └── seed.js                 users + categories + 10 products + banners
├── locales/en.json             all UI copy (English-only today)
├── e2e/                        Playwright specs
├── middleware.js               protects /dashboard/* and /wishlist
└── auth.config.js              edge-safe config shared with middleware
```

**Two data sources — don't confuse them.** `lib/products-db.js` is the DB-backed
source of truth for customer pages. `lib/data.js` is the *static* starter
catalogue and is now used **only by `prisma/seed.js`** (plus a few static bits:
categories, news, testimonials, Instagram tiles). Do not wire product data back
to it.

---

## Database (MongoDB)

`prisma/schema.prisma` uses `provider = "mongodb"`. Things that differ from a SQL
setup, and that bite if you forget them:

- **Every model needs an id mapped to `_id`:**
  `String @id @default(cuid()) @map("_id")`. We keep cuid strings rather than
  ObjectIds so ids stay stable across the codebase.
- **No `@db.Text`** — Mongo strings are unbounded.
- **No `Decimal`.** All money is stored as **integer minor units (cents)**:
  `1499` == `৳14.99`. DB reads and server-side order maths run in integer cents;
  the UI and cart work in major units. Convert only at the boundary via
  `lib/money.js` (`toCents` / `toDollars` / `formatMoney`).
- **Transactions need a replica set** (see the note at the top).
- **`contains` is case-sensitive by default**, but Prisma's Mongo connector *does*
  support `mode: "insensitive"`, and product search opts into it.
- **Optional unique fields are a trap.** A non-sparse unique index treats a
  missing field as `null` and allows only one such document, so `Product.sku` is
  deliberately **not** `@unique`; uniqueness is enforced in the server action when
  a SKU is actually supplied. The same reasoning applies to "one live offer per
  product" and "one default address per user" — both enforced in application code.

After changing the schema: `npm run db:push`, then `npm run db:seed` if needed.

---

## Orders & inventory

`lib/order-actions.js` `placeOrderAction` is the critical path. It runs inside a
single `prisma.$transaction`:

- Prices and names are recomputed **from the DB**, never trusted from the client
  cart (anti-tampering). A live Hot Deals offer is applied here too, so the
  discounted price shown is the price charged.
- Stock is decremented with a guarded `updateMany({ where: { id, stock: { gte: qty } } })`.
  `count === 0` means a racing order took the stock, and the whole transaction
  rolls back. **Keep this guard.** There is no row locking — MongoDB has none to
  take; the predicate is the guarantee.
- Order numbers are `ECO-` + 8 CSPRNG characters, retried on the (vanishingly
  rare) unique-constraint collision.
- Cancelling an order returns its stock to the catalogue
  (`lib/inventory.js restockCancelledOrder`), in the same transaction as the
  status change. Both cancel paths — admin direct, and admin approving a
  moderator's request — do this.
- `DELIVERED` and `CANCELLED` are terminal; reopening them is rejected.
- The coupon table is duplicated in `CartContext.COUPONS` and `order-actions`
  `COUPONS` and must stay in sync.

---

## Hot Deals offers

The storefront's Hot Deals area is driven by `ProductOffer` rows, not by uploaded
artwork. An admin picks a product, a percentage and an end time from
`/dashboard/banners` (choose "Hot Deals product offer" in the dropdown at the top
of the form).

- **The discount is real.** While an offer is live it is the product's selling
  price *everywhere* — Hot Deals card, shop grid, product page, cart and
  checkout.
- **`Product.price` is never rewritten**, so expiry needs no cleanup job: once
  `endsAt` passes the offer stops being live and the original price applies on the
  next read.
- The offer ending **soonest** takes the big featured card; the rest become small
  cards, and leftover slots are topped up with ordinary products. With no live
  offer the featured card is hidden entirely.
- At most **one live offer per product**, enforced in
  `app/dashboard/offers/_actions.js`.

The maths lives in `lib/offers.js`, and `shape()` in `lib/products-db.js` is what
makes the price effective for every caller.

---

## Cart / wishlist state

`lib/CartContext.jsx` is a client-only Context + `useReducer` (no external state
library). The cart persists to `localStorage` under `ecobazar-cart-v1`, tagged
with its owner so one account's cart can't leak to the next visitor. For signed-in
users the cart is also mirrored to the DB (`lib/cart-actions.js`) and a guest cart
is **merged in on login**. The wishlist is signed-in only and lives in the DB —
never in `localStorage`. `useCart()` also exposes the toast system.

---

## Auth — credentials + optional OAuth

`Credentials` is always registered. `Google` and `Facebook` are registered **only**
when both of their env vars are non-empty:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

Empty values → the provider isn't mounted, the button isn't rendered, and there
are no warnings; the app boots clean with no OAuth config. The login page reads
`hasGoogle` / `hasFacebook` server-side. Google keeps
`allowDangerousEmailAccountLinking` on (it verifies email); Facebook does not,
because its email isn't reliably verified and auto-linking would be a takeover
risk.

The `createUser` event promotes the very first user in the system to ADMIN.

Password reset and email verification use one-time, 1-hour tokens in the
`VerificationToken` table (`lib/tokens.js`). Mail goes through `lib/mailer.js`,
which **logs to the server console in development** — swap its body for a real
provider (Resend, SMTP, SES) and no call site changes.

---

## Environment variables

```
DATABASE_URL            mongodb+srv://…  (replica set required)
NEXTAUTH_SECRET         any long random string
NEXTAUTH_URL            http://localhost:3000 in dev; your real URL in prod
AUTH_TRUST_HOST         "true"
GOOGLE_CLIENT_ID        optional
GOOGLE_CLIENT_SECRET    optional
FACEBOOK_CLIENT_ID      optional
FACEBOOK_CLIENT_SECRET  optional
UPLOAD_DIR              ./public/uploads/products
UPLOAD_URL_PREFIX       /uploads/products
```

`AVATAR_UPLOAD_DIR` / `AVATAR_UPLOAD_URL_PREFIX` and `BANNER_UPLOAD_DIR` /
`BANNER_UPLOAD_URL_PREFIX` override the avatar and banner directories the same way.

---

## Image uploads

Three endpoints, differing only in who may call them, the size cap and the target
directory. Shared safety rules live in `lib/upload.js`:

| Endpoint              | Who            | Max   | Dev directory / Blob folder |
|-----------------------|----------------|-------|-----------------------------|
| `/api/upload`         | ADMIN + MOD    | 4 MB  | `public/uploads/products` / `products/` |
| `/api/upload/avatar`  | any signed-in  | 2 MB  | `public/uploads/avatars` / `avatars/`   |
| `/api/upload/banner`  | ADMIN          | 6 MB  | `public/uploads/banners` / `banners/`   |

Where the bytes land is decided by `lib/upload-store.js`: Vercel Blob when
`BLOB_READ_WRITE_TOKEN` is set, otherwise the local `public/uploads` directory.
See the deployment section for why.

The stored filename is `<timestamp>-<sha1>.<ext>`, and **the extension comes from
the validated MIME type, never from the uploaded filename** — which is also
checked against the file's magic bytes. Deriving it from `file.name` allowed
`filename="x.html"` with `Content-Type: image/png`, landing an HTML file in
`/public` that Next serves as `text/html` from the app's own origin (stored XSS,
reachable through the avatar route by any signed-in user).

---

## Conventions

- File extensions signal component type: server components/pages are `.js`,
  client components are `.jsx`. `"use client"` / `"use server"` are load-bearing.
- A `"use server"` file may export **only async functions**. `export const FOO = […]`
  there compiles under `next build` (tree-shaken) but throws at render time in dev.
  Constants belong in a plain module — see `lib/order-status.js`.
- Input validation uses **Zod** in server actions before any DB write.
- UI copy lives in `locales/en.json` and is read through `t()` / `useT()`.
- `auth.js` (root) and `middleware.js` are thin; the real config is `lib/auth.js`
  and `auth.config.js`.

---

## Useful commands

```bash
npm run dev            # dev server on 0.0.0.0:3000 (hostname pinned for LAN access)
npm run build          # prisma generate, then next build
npm start              # serve the production build
npm run lint           # eslint (flat config, eslint-config-next)

npm run db:push        # sync schema to MongoDB — the way to apply changes
npm run db:studio      # Prisma Studio
npm run db:seed        # seed users + categories + products + banners
npm run db:migrate     # NOT supported on MongoDB — use db:push

npm run test:e2e       # Playwright specs (needs a seeded replica-set DB)
npm run test:e2e:ui    # Playwright UI mode
npm run test:e2e:report
```

---

## Known gaps

- **`e2e/checkout.spec.js` is stale** — it still fills a USA/Illinois billing
  form, but checkout moved to Bangladeshi Division/District/Thana selects. The
  spec fails on `select[name="country"]`.
- **Password reset does not invalidate existing sessions.** With JWT sessions,
  someone already signed in stays signed in after the owner resets the password.
  Fixing it needs a token-version field on `User`, checked in the `jwt` callback.
- **Rate limiting is in-memory** (`lib/rate-limit.js`), so it does not coordinate
  across instances — it is ineffective on serverless. Needs Redis/Upstash.
- **Lint reports 8 React Compiler advisories** (`set-state-in-effect` in
  `CartContext`, `ShopClient`, `PrimaryNav`, `DashboardShell`; `purity` in
  `PromoBanners`). Not runtime bugs, but they block React Compiler adoption.
- `middleware.js` uses the file convention Next 16 deprecated in favour of
  `proxy.js`. It still works; the build warns.
- Review approve/reject actions, and real bKash / Nagad / SSLCOMMERZ payment
  integration (the schema fields exist).

---

## Deploying to MongoDB Atlas + Vercel

Every route is dynamic (`ƒ`), so the build never touches the database — a missing
or wrong `DATABASE_URL` fails at request time, not build time.

### 1. Atlas

1. In your cluster: **Database Access** → create a user with *Read and write to any
   database*.
2. **Network Access** → add `0.0.0.0/0` (Vercel's build and function IPs are not
   fixed, so an allowlist of specific addresses will not work).
3. Copy the connection string and **add the database name** before the `?`:

   ```
   ✗ mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true
   ✓ mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/ecobazar?retryWrites=true
                                                        ^^^^^^^^^
   ```

   Without it every query fails with
   `AtlasError: empty database name not allowed`. URL-encode the password if it
   contains `@ : / ? # [ ] %`.
4. Point your local `.env` at Atlas and seed it once:

   ```bash
   npm run db:push
   npm run db:seed
   ```

> **`DATABASE_URL` belongs in `.env`, not `.env.local`.** The Prisma CLI
> (`db:push`, `db:seed`, `db:studio`) reads `.env` only, while Next.js gives
> `.env.local` **higher** precedence. Defining it in both lets the CLI and the app
> talk to different databases — seeding appears to succeed while every page errors.

### 2. Vercel Blob (uploads)

Vercel's filesystem is read-only at runtime and wiped on each deploy, so uploads
cannot be written to `public/`. `lib/upload-store.js` picks its backend from the
environment:

| `BLOB_READ_WRITE_TOKEN` | Backend       | Returned URL                                  |
|-------------------------|---------------|-----------------------------------------------|
| set (Vercel)            | Vercel Blob   | `https://<id>.public.blob.vercel-storage.com/…` |
| not set (local dev)     | `public/uploads/…` | `/uploads/products/…`                     |

In the Vercel dashboard: **Storage** → **Create Database** → **Blob**, then
connect it to the project. Vercel injects `BLOB_READ_WRITE_TOKEN` automatically —
you do not paste it by hand. Leave it unset locally so `npm run dev` keeps writing
to `public/uploads` as before.

Blob URLs are a remote host, so `next.config.mjs` allows
`*.public.blob.vercel-storage.com` in `images.remotePatterns`. Images already
committed under `public/uploads/` keep serving as static assets either way.

### 3. Deploy

```bash
git push -u origin feature/auth-hardening     # or merge to main first
```

Then on vercel.com: **Add New → Project → Import Git Repository**, pick the repo,
and add these environment variables before the first deploy:

| Variable          | Value                                                    |
|-------------------|----------------------------------------------------------|
| `DATABASE_URL`    | your Atlas string, **including `/ecobazar`**              |
| `NEXTAUTH_SECRET` | a long random string (`openssl rand -base64 32`)          |
| `NEXTAUTH_URL`    | `https://<your-project>.vercel.app`                       |
| `AUTH_TRUST_HOST` | `true`                                                    |

`BLOB_READ_WRITE_TOKEN` arrives on its own once the Blob store is connected. The
OAuth and `UPLOAD_*` variables are optional — omit them and Google/Facebook simply
aren't offered, and uploads use the defaults.

Framework preset, build command and install command are all auto-detected. `npm run
build` runs `prisma generate` first, and `postinstall` runs it again on install, so
the client is always generated against the deployed schema. The repo's `.npmrc`
sets `legacy-peer-deps=true`, which Vercel respects — it is required while
`next-auth@5` beta still declares a `next@14 || 15` peer range.

`NEXTAUTH_URL` needs the real deployment URL. For OAuth, also add
`https://<your-project>.vercel.app/api/auth/callback/google` (and `/facebook`) to
the provider's authorised redirect URIs.

### Still true after deploying

- **Password reset emails go nowhere.** `lib/mailer.js` only logs, so the reset
  link is visible in Vercel's runtime logs and nowhere else. Swap its body for
  Resend/SMTP/SES when you need it — no call site changes.
- **Rate limiting is per-instance.** `lib/rate-limit.js` keeps counters in process
  memory, so the login brute-force protection is effectively absent across
  serverless invocations. Needs Redis/Upstash.
- `images.minimumCacheTTL: 0` is applied **in development only** — it exists for
  the local image-overwrite workflow and would make every production image request
  re-run optimization.

There is **no test runner** for unit tests; Playwright covers e2e only.
