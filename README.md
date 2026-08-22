# Ecobazar

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
npm run db:seed                   # dev seed: 4 test users + 59-product catalogue
                                  #  + banners + Hot Deals offers + star ratings

npm run dev                       # http://localhost:3000
```

For a fresh **production** install, use `npm run db:seed:prod` instead it takes admin credentials
from env vars (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, optional `SEED_ADMIN_USERNAME` /
`SEED_ADMIN_NAME`), never creates test accounts, and can wipe existing catalogue with
`SEED_WIPE_EXISTING=true`. See `prisma/seed.prod.js`.

`npm run db:migrate` exists but **does not work on MongoDB** Prisma has no
migration history for this connector. Always use `npm run db:push`.

### Test accounts

Sign in at `/login` with **either the username or the email**, plus the password. The login form
renders quick-fill buttons for these four accounts so you don't have to type them:

| Name | Email | Username | Password | Role |
|---|---|---|---|---|
| test-admin | `test-admin@shanto.dev` | `test-admin` | `test-admin` | ADMIN |
| test-mod | `test-mod@dhanto.dev` | `mod` | `moderator` | MODERATOR |
| customer | `customer@shanto.dev` | `customer` | `customer` | CUSTOMER |
| customer-2 | `customer2@shanto.dev` | `customer-2` | `customer-2` | CUSTOMER |

`test-admin` is seeded as the **super admin** (`User.isSuperAdmin`) and can never be
demoted or deleted by anyone.

**All four of these are DEMO accounts** — they can browse, sign in, view the dashboard, and place
orders, but every mutating action (edit product, change order status, approve/reject request,
upload image, change profile, submit review, request return, …) is blocked with a friendly
`"This is a demo account. Editing is disabled — sign up for your own account to try changes."`
error. Newly-signed-up users, and any user created by super-admin from `/dashboard/users`, are
**not** demo — they can do everything their role normally allows. The demo whitelist is a fixed
set of emails in `lib/demo-accounts.js` (`DEMO_EMAILS`); adding another demo account = adding its
email to that set.

### Real super admin (private — not in the four demo accounts)

The four demo accounts above have `isSuperAdmin=false` and can't mutate anything, so somebody has
to actually run the store. That person is **the real super admin**, provisioned from env vars
so the credentials never enter the repo:

```
# .env.local  (gitignored — never committed)
SEED_ADMIN_EMAIL="you@yourdomain.example"
SEED_ADMIN_PASSWORD="<a-long-strong-password>"
SEED_ADMIN_USERNAME="youradmin"    # optional — defaults to the email's local part
SEED_ADMIN_NAME="Your Name"        # optional — defaults to "Super Admin"
```

Then `npm run db:seed` upserts that user as ADMIN with `isSuperAdmin=true`, demotes any prior
super admin so exactly one exists, and refuses to promote an email that appears in
`DEMO_EMAILS` (which would immediately block itself). Skipped silently when the vars aren't set,
so a fresh clone can seed and boot without a super admin (add one later, or promote via
mongosh). Same variables work for production — set them on the VPS's runtime `.env` and run
`npm run db:seed:prod`.

**What each account can do:**
- **Real super admin** — everything. Undeletable, undemotable, exempt from every guard.
- **Any user the super admin creates from `/dashboard/users`** (including CUSTOMERs, which is
  new — the dropdown now offers all three roles) — full permissions for that role. Not demo.
- **The four demo accounts** — sign in, browse, place orders. Every other mutation returns the
  demo-account error. Safe to share with recruiters or paying customers evaluating the app.

Identity model: `username` is a unique login handle and is **nullable** (OAuth
users have none); `email` is unique and required, and is what password reset and
verification use. A verification email is issued at signup but is **not**
enforced at login.

---

## Route map

| URL                             | Access                                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                             | public                                                                                                                                                        |
| `/shop`                         | public                                                                                                                                                        |
| `/shop/[slug]`                  | public — product detail                                                                                                                                       |
| `/deals/[slug]`                 | public — promo landing page                                                                                                                                   |
| `/cart`                         | public                                                                                                                                                        |
| `/checkout`                     | public (guest checkout allowed)                                                                                                                               |
| `/orders/lookup`                | public — guest tracker (nav: "Track Order"). Signed-in users → `/dashboard/orders`.                                                                           |
| `/contact`                      | public                                                                                                                                                        |
| `/login`, `/register`           | public — signed-in users see a "you're already signed in" panel with continue + sign-out links instead of the form                                            |
| `/forgot-password`              | public                                                                                                                                                        |
| `/reset-password`               | public (needs a `?token=`)                                                                                                                                    |
| `/unauthorized`                 | public — branches on session: anon sees log-in / create-account buttons; signed-in-wrong-role sees "you don't have access to this page" with a dashboard link |
| `/wishlist`                     | signed in — per-user, stored in DB                                                                                                                            |
| `/dashboard`                    | any authenticated user (role router)                                                                                                                          |
| `/dashboard/orders`             | any auth user (data scoped by role) — modal shows ordered items + totals + return/review CTAs for the buyer                                                   |
| `/dashboard/settings`           | any auth user (own account only). Currency card removed (BDT-only).                                                                                           |
| `/dashboard/products`           | ADMIN + MODERATOR                                                                                                                                             |
| `/dashboard/products/new`       | ADMIN + MODERATOR                                                                                                                                             |
| `/dashboard/products/[id]/edit` | ADMIN + MODERATOR (mods: own only)                                                                                                                            |
| `/dashboard/reviews`            | ADMIN + MODERATOR                                                                                                                                             |
| `/dashboard/users`              | ADMIN only                                                                                                                                                    |
| `/dashboard/banners`            | ADMIN only — banners + Hot Deals offers                                                                                                                       |
| `/dashboard/approvals`          | ADMIN only — moderator request queue                                                                                                                          |
| `/dashboard/profile-requests`   | ADMIN only — email/phone change queue                                                                                                                         |
| `/dashboard/audit-log`          | ADMIN only                                                                                                                                                    |

### API routes

| URL                         | Access                                      |
| --------------------------- | ------------------------------------------- |
| `/api/auth/[...nextauth]`   | NextAuth handlers                           |
| `/api/auth/signup`          | public (rate-limited)                       |
| `/api/auth/forgot-password` | public (never reveals if an account exists) |
| `/api/auth/reset-password`  | public (one-time token)                     |
| `/api/auth/verify`          | public (one-time token)                     |
| `/api/products`             | public — search/pagination                  |
| `/api/upload`               | ADMIN + MODERATOR — product images          |
| `/api/upload/avatar`        | any signed-in user                          |
| `/api/upload/banner`        | ADMIN only                                  |

---

## Authorization three enforcement layers

Access control is deliberately layered; **do not rely on any single layer**:

1. **`middleware.js`** matches `/dashboard/*` and `/wishlist*` only. It knows
   _signed in or not_, nothing more: anonymous `/dashboard` requests go to
   `/unauthorized?next=...`, anonymous `/wishlist` to `/login?next=...`. It runs
   on the Edge runtime and is built from the edge-safe `auth.config.js`, so
   Prisma and bcrypt never enter the middleware bundle.
2. **Server components / pages** call `requireRole(...)` / `requireAuth(...)`
   from `lib/auth-helpers.js` to enforce the actual role per route.
3. **Server actions & API routes** re-check the role again, even though the
   route is already protected.

`session.user` carries `id` and `role`, threaded through the JWT so role checks
don't hit the DB on a normal request. The JWT re-reads the role from the DB every
5 minutes (`ROLE_TTL_MS` in `lib/auth.js`) so a promotion or demotion can't stay
stale for a whole token lifetime.

**Moderator ownership rule:** MODERATORs may create products, but may only
edit/delete products where `Product.createdById === user.id`. ADMIN can edit any.
Enforced in the server actions, not the schema.

**Approval queue:** actions a moderator may not perform directly become a PENDING
`ApprovalRequest` for an admin to approve or reject currently `PRODUCT_DELETE`
and `ORDER_CANCEL`. On approval the admin performs the real action.

**Every privileged write appends an `AuditLog` row** (`actorId`, `action`,
`entity`, `entityId`, `metadata`). Follow the existing pattern when adding a
mutating action.

**Session timeout:** sessions expire on _inactivity_ 6 h for customers, 12 h for
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
│   │   ├── banners/            ADMIN   image banners AND Hot Deals offers
│   │   ├── approvals/          ADMIN   moderator request queue
│   │   ├── profile-requests/   ADMIN   email/phone change queue
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
│   └── data.js                 static starter catalogue   SEED INPUT ONLY
├── prisma/
│   ├── schema.prisma           mongodb provider
│   └── seed.js                 users + categories + 10 products + banners
├── locales/en.json             all UI copy (English-only today)
├── e2e/                        Playwright specs
├── middleware.js               protects /dashboard/* and /wishlist
└── auth.config.js              edge-safe config shared with middleware
```

**Two data sources don't confuse them.** `lib/products-db.js` is the DB-backed
source of truth for customer pages. `lib/data.js` is the _static_ starter
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
- **No `@db.Text`** Mongo strings are unbounded.
- **No `Decimal`.** All money is stored as **integer minor units (cents)**:
  `1499` == `৳14.99`. DB reads and server-side order maths run in integer cents;
  the UI and cart work in major units. Convert only at the boundary via
  `lib/money.js` (`toCents` / `toDollars` / `formatMoney`).
- **Transactions need a replica set** (see the note at the top).
- **`contains` is case-sensitive by default**, but Prisma's Mongo connector _does_
  support `mode: "insensitive"`, and product search opts into it.
- **Optional unique fields are a trap.** A non-sparse unique index treats a
  missing field as `null` and allows only one such document, so `Product.sku` is
  deliberately **not** `@unique`; uniqueness is enforced in the server action when
  a SKU is actually supplied. The same reasoning applies to "one live offer per
  product" and "one default address per user" both enforced in application code.

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
  rolls back. **Keep this guard.** There is no row locking MongoDB has none to
  take; the predicate is the guarantee.
- Order numbers are `ECO-` + 8 CSPRNG characters, retried on the (vanishingly
  rare) unique-constraint collision.
- Cancelling an order returns its stock to the catalogue
  (`lib/inventory.js restockCancelledOrder`), in the same transaction as the
  status change. Same helper is called from the customer return path.
- `DELIVERED` and `CANCELLED` are terminal; reopening them is rejected. The
  **only allowed exit from `DELIVERED`** is the customer's own return within 15
  days that goes through the dedicated `requestReturnAction`, not the admin
  StatusSelect.
- The coupon table is duplicated in `CartContext.COUPONS` and `order-actions`
  `COUPONS` and must stay in sync.

### Customer return + review (post-delivery)

Both live in `app/dashboard/orders/_customer-actions.js` (customer-callable `requireAuth`, not
`requireRole`) and are surfaced through the order-details modal:

- **`requestReturnAction({orderId})`** ownership + `DELIVERED` + within 15 days of the
  `DELIVERED` timeline event (see `lib/order-return.js` `canRequestReturn`). On success flips the
  order to `CANCELLED`, restocks items, writes an `OrderStatusEvent` with note
  `"Return requested by customer"`, appends `AuditLog`. After the window closes the button hides;
  the order stays `DELIVERED` permanently.
- **`submitReviewAction({orderId, productId, rating, body})`** ownership + `DELIVERED` +
  product-in-order + no existing review by this user for this product (`Review.@@unique
([productId, userId])`). Creates the `Review` row (`approved: true` no moderation UI yet),
  recomputes `Product.rating` as the running average of approved reviews.

### Guest → user order linking

`lib/user-service.js` exports `claimGuestOrdersForUser(userId, email)`. Runs after every signup
(credentials route + OAuth `createUser` event). Finds every order with matching email (case-
insensitive) and `userId=null`, sets `userId=userId`. A customer who checks out as a guest and
later opens an account with the same email sees their prior orders in the dashboard on first
login, no manual link step.

---

## Hot Deals offers

The storefront's Hot Deals area is driven by `ProductOffer` rows, not by uploaded
artwork. An admin picks a product, a percentage and an end time from
`/dashboard/banners` (choose "Hot Deals product offer" in the dropdown at the top
of the form).

- **The discount is real.** While an offer is live it is the product's selling
  price _everywhere_ Hot Deals card, shop grid, product page, cart and
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
is **merged in on login**. The wishlist is signed-in only and lives in the DB  
never in `localStorage`. `useCart()` also exposes the toast system.

---

## Auth credentials + optional OAuth

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
which **logs to the server console in development** swap its body for a real
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

| Endpoint             | Who           | Max  | Dev directory / Blob folder             |
| -------------------- | ------------- | ---- | --------------------------------------- |
| `/api/upload`        | ADMIN + MOD   | 4 MB | `public/uploads/products` / `products/` |
| `/api/upload/avatar` | any signed-in | 2 MB | `public/uploads/avatars` / `avatars/`   |
| `/api/upload/banner` | ADMIN         | 6 MB | `public/uploads/banners` / `banners/`   |

Where the bytes land is decided by `lib/upload-store.js`: Vercel Blob when
`BLOB_READ_WRITE_TOKEN` is set, otherwise the local `public/uploads` directory.
See the deployment section for why.

The stored filename is `<timestamp>-<sha1>.<ext>`, and **the extension comes from
the validated MIME type, never from the uploaded filename** which is also
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
  Constants belong in a plain module see `lib/order-status.js`.
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

npm run db:push        # sync schema to MongoDB   the way to apply changes
npm run db:studio      # Prisma Studio
npm run db:seed        # seed users + categories + products + banners
npm run db:migrate     # NOT supported on MongoDB   use db:push

npm run test:e2e       # Playwright specs (needs a seeded replica-set DB)
npm run test:e2e:ui    # Playwright UI mode
npm run test:e2e:report
```

---

## Known gaps

- **Several e2e specs are stale from the seed rebrand.** Tests reference the OLD seed's product
  slugs (`green-apple`, `eggplant`, `green-capsicum`) and OLD banner slugs (`top-deals`,
  `summer-sale`), all replaced during the Bangla catalogue rebrand. They fail with
  `Seed product "green-apple" missing   run npm run db:seed`. Files affected:
  `banners.spec.js`, `cart.spec.js`, `category.spec.js`, `checkout.spec.js`,
  `fix05-cart-reprice.spec.js`, `fix06-order-lookup.spec.js`, `fix08-product-suggestions.spec.js`,
  `storefront.spec.js`, `order-details.spec.js`. Latest run: **42 passed, 15 failed, 3 skipped,
  10 didn't run**.
- **`e2e/checkout.spec.js` is doubly stale** its billing form still fills USA/Illinois selects
  but checkout moved to Bangladeshi Division/District/Thana. Fixing the slug isn't enough there.
- **Review moderation is TODO** customer-submitted reviews are auto-approved and immediately
  affect `Product.rating`. `Review.approved` is in the schema but there's no admin approve/reject
  UI.
- **Returns are recorded as `CANCELLED`** with a `"Return requested by customer"` timeline note  
  no distinct `RETURNED` status, no automated refund.
- **Password reset does not invalidate existing sessions.** With JWT sessions,
  someone already signed in stays signed in after the owner resets the password.
  Fixing it needs a token-version field on `User`, checked in the `jwt` callback.
- **Rate limiting is in-memory** (`lib/rate-limit.js`), so it does not coordinate
  across instances it is ineffective on serverless. Needs Redis/Upstash.
- **Lint reports a few React Compiler advisories** (`set-state-in-effect` in
  `CartContext`, `ShopClient`, `PrimaryNav`, `DashboardShell`; `purity` in
  `PromoBanners`). Not runtime bugs, but they block React Compiler adoption.
- `middleware.js` uses the file convention Next 16 deprecated in favour of
  `proxy.js`. It still works; the build warns.
- Real bKash / Nagad / SSLCOMMERZ payment integration (the schema fields exist).

---

## Deployment

Two paths are documented the **live site** (`https://eco.shanto.dev/`) uses the VPS + GitHub
Actions path. The Vercel path is kept for reference in case you'd rather use a serverless host.

### Path A VPS + GitHub Actions auto-deploy (production)

The live site runs on a 1 GB Ubuntu 24.04 OpenVZ VPS with:

- Node.js 22 + PM2 (systemd-managed, `--max-memory-restart 500M`)
- MongoDB 8.0 as a single-node replica set on `127.0.0.1:27017` (localhost-only, no auth)
- nginx 1.24 reverse-proxying 80/443 → `127.0.0.1:3000`
- Let's Encrypt cert (`certbot`), auto-renewed by the `certbot.timer` unit
- `ufw` allow 22 / 80 / 443
- Non-root `ecobazar` user, `.env` at `/home/ecobazar/app/.env` (chmod 600, never rsync'd over)

Every push to `main` triggers `.github/workflows/deploy.yml`:

1. Ubuntu 24.04 runner (matches VPS exactly).
2. `npm ci --legacy-peer-deps` + `npm run build` (build has 7 GB RAM no OOM risk).
3. `npm prune --omit=dev`.
4. Rsync `.next/`, `node_modules/`, `public/`, source tree to the VPS as the `ecobazar` user.
5. `pm2 restart ecobazar --update-env`.
6. Smoke test curl the live URL and expect HTTP 200 within 25 s. Job fails red if not.

Required repo secrets: `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_HOST`, `DEPLOY_USER`.

**Do not run `npm ci` or `next build` on the VPS itself** the 1 GB OpenVZ container's
`privvmpages` limit OOMs the fork. The runner sidesteps this by building off-box. See
`DOCUMENTATION.md` §24 for the full runbook.

### Path B MongoDB Atlas + Vercel (alternative)

Every route is dynamic (`ƒ`), so the build never touches the database a missing
or wrong `DATABASE_URL` fails at request time, not build time.

### 1. Atlas

1. In your cluster: **Database Access** → create a user with _Read and write to any
   database_.
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
> talk to different databases seeding appears to succeed while every page errors.

### 2. Vercel Blob (uploads)

Vercel's filesystem is read-only at runtime and wiped on each deploy, so uploads
cannot be written to `public/`. `lib/upload-store.js` picks its backend from the
environment:

| `BLOB_READ_WRITE_TOKEN` | Backend            | Returned URL                                    |
| ----------------------- | ------------------ | ----------------------------------------------- |
| set (Vercel)            | Vercel Blob        | `https://<id>.public.blob.vercel-storage.com/…` |
| not set (local dev)     | `public/uploads/…` | `/uploads/products/…`                           |

In the Vercel dashboard: **Storage** → **Create Database** → **Blob**, then
connect it to the project. Vercel injects `BLOB_READ_WRITE_TOKEN` automatically  
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

| Variable          | Required | Value                                                                                                                                                                               |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | yes      | your Atlas string, **including `/ecobazar`**                                                                                                                                        |
| `NEXTAUTH_SECRET` | yes      | a long random string (`openssl rand -base64 32`)                                                                                                                                    |
| `AUTH_TRUST_HOST` | yes      | `true`                                                                                                                                                                              |
| `NEXTAUTH_URL`    | no       | `https://<your-project>.vercel.app` — only needed once you have a custom domain; otherwise `VERCEL_URL` is used automatically for email links (see `appBaseUrl()` in lib/tokens.js) |

Set each one for **Production, Preview and Development**, then redeploy  
environment variables are read at build time, so an existing deployment does not
pick them up.

If `DATABASE_URL` is missing or has no database name, the build now **fails with a
message naming the fix** (see `assertDatabaseUrl()` in lib/prisma.js) rather than
deploying an app that throws Prisma internals on every page.

`BLOB_READ_WRITE_TOKEN` arrives on its own once the Blob store is connected. The
OAuth and `UPLOAD_*` variables are optional omit them and Google/Facebook simply
aren't offered, and uploads use the defaults.

Framework preset, build command and install command are all auto-detected. `npm run
build` runs `prisma generate` first, and `postinstall` runs it again on install, so
the client is always generated against the deployed schema. The repo's `.npmrc`
sets `legacy-peer-deps=true`, which Vercel respects it is required while
`next-auth@5` beta still declares a `next@14 || 15` peer range.

`NEXTAUTH_URL` needs the real deployment URL. For OAuth, also add
`https://<your-project>.vercel.app/api/auth/callback/google` (and `/facebook`) to
the provider's authorised redirect URIs.

### Still true after deploying

- **Password reset emails go nowhere.** `lib/mailer.js` only logs, so the reset
  link is visible in Vercel's runtime logs and nowhere else. Swap its body for
  Resend/SMTP/SES when you need it no call site changes.
- **Rate limiting is per-instance.** `lib/rate-limit.js` keeps counters in process
  memory, so the login brute-force protection is effectively absent across
  serverless invocations. Needs Redis/Upstash.
- `images.minimumCacheTTL: 0` is applied **in development only** it exists for
  the local image-overwrite workflow and would make every production image request
  re-run optimization.

There is **no test runner** for unit tests; Playwright covers e2e only.
