# Ecobazar — Project Documentation

> A full, honest reference for the Ecobazar organic-grocery e‑commerce store: how to run it,
> every feature, the tech stack, how errors / stock / money / security are handled, what each
> user role can do, where the known weaknesses are and how to find them, plus a large FAQ.
>
> This document is written to double as a **blog source** and an **onboarding rule book**. It is
> accurate to the code as of the `feature/auth-hardening` branch. Where the code and older notes
> disagree, this document follows the **code**.

---

## Table of contents

1. [What Ecobazar is](#1-what-ecobazar-is)
2. [Why this project is good](#2-why-this-project-is-good)
3. [Tech stack](#3-tech-stack)
4. [Getting started — how to run it](#4-getting-started--how-to-run-it)
5. [Project structure](#5-project-structure)
6. [Feature list — what is built](#6-feature-list--what-is-built)
7. [User roles & permissions](#7-user-roles--permissions)
8. [Route reference](#8-route-reference)
9. [Authentication & authorization](#9-authentication--authorization)
10. [Orders, inventory & the checkout critical path](#10-orders-inventory--the-checkout-critical-path)
11. [Money & multi-currency](#11-money--multi-currency)
12. [Cart & wishlist](#12-cart--wishlist)
13. [Error handling](#13-error-handling)
14. [Security — known issues & how to find them](#14-security--known-issues--how-to-find-them)
15. [Critical cases & how they are handled](#15-critical-cases--how-they-are-handled)
16. [Data model](#16-data-model)
17. [Configuration & environment variables](#17-configuration--environment-variables)
18. [Internationalization & theming](#18-internationalization--theming)
19. [Testing](#19-testing)
20. [Conventions & contribution rules](#20-conventions--contribution-rules)
21. [Known limitations & TODOs](#21-known-limitations--todos)
22. [FAQ](#22-faq)
23. [Glossary](#23-glossary)

---

## 1. What Ecobazar is

Ecobazar is a **full-stack e‑commerce store for organic groceries**. It has two faces living on the
**same domain**:

- **Storefront** — the public shop: browse, search, filter, product detail, cart, wishlist, checkout
  (guest or signed‑in), promo/deal landing pages.
- **Dashboard** (`/dashboard`) — a **role-based admin area** for managing products, orders, users,
  reviews, promo banners, profile-change approvals, store currency, and an audit log.

It is built on **Next.js 16 (App Router) + React 19**, **Prisma + MongoDB**, **NextAuth v5 (Auth.js)**,
**Tailwind CSS v4**, and **Zod** for validation. Money is Bangladesh‑based (BDT) with admin‑managed
multi‑currency display.

---

## 2. Why this project is good

- **Defence-in-depth authorization.** Access control is enforced at **three independent layers**
  (middleware → server components → server actions/API). No single layer is trusted alone.
- **Anti-tampering checkout.** Prices and names are **recomputed from the database** at checkout —
  the client cart is never trusted for money.
- **Race-safe inventory.** Stock is decremented with a **guarded atomic update** inside a DB
  transaction, so two buyers cannot both take the last unit (no overselling).
- **Audit trail.** Every privileged write appends an **`AuditLog`** row (who / what / when / metadata).
- **Clean auth hardening.** Brute-force throttling, per-IP rate limits on auth endpoints,
  anti-enumeration on password reset, bcrypt password hashing, one-time expiring tokens.
- **Graceful configuration.** OAuth providers auto-mount only when configured; the app boots clean
  with zero OAuth setup. Currency, theme, and language all degrade to safe defaults.
- **Performance-minded data loading.** The shop uses **server-side pagination** (9 products per
  request) so the browser never downloads the whole catalogue.
- **Money correctness.** All money is stored as **integer minor units (cents/poisha)** — no floating
  point drift — and converted only at display boundaries.
- **Honest, documented edge cases.** The code openly documents its own race caveats and trade-offs
  (see [§14](#14-security--known-issues--how-to-find-them) and [§15](#15-critical-cases--how-they-are-handled)).

---

## 3. Tech stack

Source of truth: `package.json`.

| Area | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | `16.2.6` |
| UI runtime | React / React DOM | `19.2.4` |
| Styling | Tailwind CSS v4 (CSS-first, PostCSS plugin) | `^4` |
| ORM | Prisma Client / CLI | `^5.22.0` |
| Database | **MongoDB** (Prisma `mongodb` connector, **replica set required**) | — |
| Auth | NextAuth v5 / Auth.js + Prisma adapter | `^5.0.0-beta.25` / `^2.7.4` |
| Password hashing | `bcryptjs` (pure JS) | `^2.4.3` |
| Validation | Zod | `^3.23.8` |
| Linting | ESLint (flat config) + `eslint-config-next` | `^9` / `16.2.6` |
| E2E testing | Playwright | `^1.61.1` |

Notes:
- **No `engines` field** and **no `tsconfig.json`** — this is a **JavaScript** project (not TypeScript).
- **No `tailwind.config.js`** — Tailwind v4 keeps its config in CSS (`app/globals.css`).
- **No unit-test runner** — only Playwright end-to-end tests exist.
- `postinstall` runs `prisma generate`, so the Prisma client is regenerated on every `npm install`.

---

## 4. Getting started — how to run it

### 4.1 Prerequisites

1. **Node.js** (a current LTS; the repo declares no specific version).
2. **A MongoDB replica set.** This is **mandatory** — the checkout inventory transaction cannot run
   on a standalone `mongod`. Two options:
   - **MongoDB Atlas** (a replica set by default), or
   - **A local single-node replica set**: start `mongod` with `--replSet rs0`, append
     `?replicaSet=rs0` to your connection string, and run `rs.initiate()` once.

### 4.2 Environment

Copy `.env.example` to `.env.local` and fill in the values (see [§17](#17-configuration--environment-variables)
for the full list). The minimum to boot:

```
DATABASE_URL="mongodb://.../ecobazar?replicaSet=rs0"
NEXTAUTH_SECRET="<a long random string>"
NEXTAUTH_URL="http://localhost:3000"
```

OAuth (Google/Facebook) is **optional** — leave those keys blank and the buttons simply don't appear.

### 4.3 Install, seed, run

```bash
npm install          # also runs `prisma generate` via postinstall
npm run db:push      # sync the Prisma schema to MongoDB (NOT db:migrate — Mongo has no migrations)
npm run db:seed      # seed test users, categories, products, demo products, promo banners
npm run dev          # dev server on http://0.0.0.0:3000
```

Build & serve production:

```bash
npm run build        # runs `prisma generate` then `next build`
npm start
```

### 4.4 All npm scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev --hostname 0.0.0.0` | Dev server (host pinned for LAN access) |
| `build` | `prisma generate && next build` | Production build |
| `start` | `next start` | Serve the production build |
| `lint` | `eslint` | Lint |
| `db:push` | `prisma db push` | **The** way to apply schema changes on MongoDB |
| `db:migrate` | `prisma migrate dev` | **NOT supported on MongoDB** — use `db:push` |
| `db:studio` | `prisma studio` | Visual DB browser |
| `db:seed` | `node prisma/seed.js` | Seed the database |
| `test:e2e` / `:ui` / `:report` | Playwright | End-to-end tests |

### 4.5 Seeded test logins

Sign in at `/login` with the **username or the email**, plus the password. On the login page there
are also **dev quick-fill buttons** (Admin / Mod / Customer 1 / Customer 2) that populate the form.

| Username | Email | Password | Role |
|---|---|---|---|
| `admin` | `admin@ecobazar.test` | `admin` | ADMIN |
| `mod` | `mod@ecobazar.test` | `mod` | MODERATOR |
| `customer` | `customer@ecobazar.test` | `customer` | CUSTOMER |
| `mamun` | `mamun@ecobazar.test` | `mamun` | CUSTOMER |

> The seed also creates **12 categories**, **10 real products** (with images), **demo placeholder
> products** for any otherwise-empty category, and **3 promo banners** (one per placement). It is
> idempotent (`upsert` everywhere) — safe to re-run.

---

## 5. Project structure

```
ecobazar-next/
├─ app/                      # App Router routes
│  ├─ page.js                # Home (server)
│  ├─ layout.js              # Root layout: Theme→Language→Currency→Cart providers + chrome
│  ├─ not-found.js           # 404 (the only App-Router error special file)
│  ├─ shop/                  # /shop + /shop/[slug] + ShopClient
│  ├─ cart/ checkout/ wishlist/ deals/ contact/
│  ├─ login/ register/ forgot-password/ reset-password/ unauthorized/
│  ├─ dashboard/             # Role-based admin area (see §8)
│  │  ├─ layout.js           # requireAuth() gate for the whole subtree
│  │  ├─ _components/        # DashboardShell (nav), role dashboards
│  │  └─ <feature>/          # page.js + _actions.js per feature
│  └─ api/                   # Route handlers (auth, products, uploads)
├─ components/               # Shared UI (ProductCard, CategoryTile, Header, Toast, …)
├─ lib/                      # Server + client logic
│  ├─ auth.js  auth-helpers.js  user-service.js  tokens.js  mailer.js  rate-limit.js
│  ├─ order-actions.js  cart-actions.js  products-db.js  data.js
│  ├─ money.js  currency.js  store-config.js  currency/CurrencyProvider.jsx
│  ├─ CartContext.jsx
│  ├─ i18n/  theme/          # cookie-based localization + dark mode
│  └─ prisma.js
├─ prisma/                   # schema.prisma + seed.js
├─ locales/en.json           # UI strings
├─ e2e/                      # Playwright specs
├─ auth.js  auth.config.js  middleware.js   # thin root auth wiring
└─ next.config.mjs  postcss.config.mjs  eslint.config.mjs  jsconfig.json
```

**File-extension convention:** `.js` = server component/module, `.jsx` = client component. The
`"use client"` / `"use server"` directives are load-bearing.

---

## 6. Feature list — what is built

### Storefront (customer-facing)
- **Home page** — hero, admin-managed promo banners, service bar, category grid, **Popular Products
  (best-sellers)** with a "See More" button, hot deals, featured products, news, testimonials, Instagram strip.
- **Shop** — **server-side paginated** product grid (9/page), live search by name, category filter,
  price range, rating filter, and sort (latest / price / name). Deep-linkable via `?q=` and `?cat=`.
- **Product detail** — image gallery with zoom, quantity stepper, add-to-cart, wishlist toggle,
  description/additional-info/reviews tabs, related products, soft‑404 with nearest-match suggestions.
- **Cart** — quantity steppers, coupon apply, live totals; desktop table / mobile cards.
- **Wishlist** — **signed-in only** (guests are redirected to login); saved items resolved against the DB.
- **Checkout** — billing form, address prefill for signed-in users, **guest checkout supported**,
  multiple payment methods (COD/PayPal/Amazon/bKash/Nagad), coupon, thank-you screen.
- **Deals pages** (`/deals/<slug>`) — promo landing pages listing only products matching a banner's tag,
  with a copy-code control.
- **Contact** — client-validated contact form + map placeholder.
- **Theme toggle** (light/dark) and **multi-currency display** (BDT/USD/AED).

### Accounts & auth
- Credentials sign-up / sign-in (username **or** email), password reset, email verification (issued,
  not enforced), optional Google/Facebook OAuth, first-ever user auto-promoted to ADMIN.

### Dashboard (role-based)
- **Overview** (role-specific dashboard), **Orders** (scoped by role), **Products** (CRUD with
  moderator ownership), **Reviews** (read), **Users** (role management, ADMIN), **Profile requests**
  (email/phone change approvals, ADMIN), **Banners** (promo management, ADMIN), **Audit log** (ADMIN),
  **Settings** (profile / password / addresses / appearance; store currency for ADMIN).

### Platform
- Image uploads (product / avatar / banner) with size + type limits and hashed filenames.
- Audit logging on privileged writes; append-only order status timeline.
- Cookie-based i18n (English) and dark-mode theme with no-flash SSR.

---

## 7. User roles & permissions

There are three roles: **CUSTOMER** (default), **MODERATOR**, **ADMIN**. Role is carried in the JWT
(`session.user.role`) and re-verified against the DB at most every 5 minutes.

### 7.1 Capability matrix

| Capability | Customer | Moderator | Admin |
|---|:--:|:--:|:--:|
| Browse shop, product detail, deals | ✅ | ✅ | ✅ |
| Add to cart / checkout (incl. as guest) | ✅ | ✅ | ✅ |
| Use wishlist | ✅ (signed in) | ✅ | ✅ |
| Place & view **own** orders | ✅ | ✅ | ✅ |
| Access `/dashboard` | ✅ (limited) | ✅ | ✅ |
| Dashboard: Overview, own Orders, Settings | ✅ | ✅ | ✅ |
| Upload own avatar | ✅ | ✅ | ✅ |
| View **all** orders | ❌ | ✅ (read-only) | ✅ (edit status) |
| Create products | ❌ | ✅ | ✅ |
| Edit / upload product images | ❌ | ✅ **own only** | ✅ any |
| Delete products | ❌ | ❌ | ✅ |
| View Reviews list | ❌ | ✅ | ✅ |
| Manage Users (promote/demote roles) | ❌ | ❌ | ✅ |
| Approve email/phone change requests | ❌ | ❌ | ✅ |
| Manage promo Banners | ❌ | ❌ | ✅ |
| View Audit Log | ❌ | ❌ | ✅ |
| Set store currency & exchange rates | ❌ | ❌ | ✅ |

### 7.2 Role notes & rules (the "rule book")

- **Customer** can only manage **their own** account and **their own** orders. They never see other
  users' data. Wishlist requires being signed in.
- **Moderator ownership rule:** a moderator may **create** products and **edit** only products where
  `Product.createdById === user.id`. Editing someone else's product throws
  `"You can only edit products you created."` **Delete is ADMIN-only** — a moderator cannot delete even
  their own product. (This asymmetry is intentional in the current code.)
- **Admin** has full control: any product, all orders + status changes, user role management, banners,
  profile-change approvals, audit log, and store currency.
- **The first user ever created is auto-promoted to ADMIN** (bootstrap). Everyone else defaults to
  CUSTOMER.
- **Dashboard nav visibility** is computed by a role rank (`CUSTOMER=0, MODERATOR=1, ADMIN=2`); a nav
  item shows only when the user's rank ≥ the item's minimum. Empty sections render nothing at all.

---

## 8. Route reference

Gate legend: **anon-blocked** = must be signed in (any role); **ADMIN** / **MOD+ADMIN** = `requireRole`.

### 8.1 Storefront routes

| Path | File | Notes |
|---|---|---|
| `/` | `app/page.js` | Home (server). Best-seller popular products from DB. |
| `/shop` | `app/shop/page.js` | Server renders first 9; `ShopClient` paginates via `/api/products`. |
| `/shop/[slug]` | `app/shop/[slug]/page.js` | Product detail; soft-404 with suggestions. |
| `/cart` | `app/cart/page.js` | Client; wired to CartContext. |
| `/checkout` | `app/checkout/page.js` | Prefills address for signed-in; guests allowed. |
| `/wishlist` | `app/wishlist/page.js` | **Protected** — anon → `/login?next=/wishlist` (middleware). |
| `/deals/[slug]` | `app/deals/[slug]/page.js` | Promo landing; inactive banner → 404. |
| `/contact` | `app/contact/page.js` | Client-validated form. |
| `/login` `/register` | `app/login`, `app/register` | Auth forms; OAuth buttons only if configured. |
| `/forgot-password` `/reset-password` | — | Password reset flow (token in `?token=`). |
| `/unauthorized` | `app/unauthorized/page.jsx` | Access-denied; builds a `/login?next=` link. |
| `*` (404) | `app/not-found.js` | 404 page. |

### 8.2 Dashboard routes

Whole subtree gated by `requireAuth()` in `app/dashboard/layout.js` (defence-in-depth behind middleware).

| Path | Role gate | Description |
|---|---|---|
| `/dashboard` | anon-blocked → role router | ADMIN/MOD/CUSTOMER see different dashboards |
| `/dashboard/orders` | anon-blocked (data scoped in-code) | Customer=own; Mod=all read-only; Admin=all + status edit |
| `/dashboard/products` | **MOD+ADMIN** | Mod sees own; Admin sees all |
| `/dashboard/products/new` | **MOD+ADMIN** | Create product |
| `/dashboard/products/[id]/edit` | **MOD+ADMIN** | Edit (own-only for Mod); delete Admin-only |
| `/dashboard/reviews` | **MOD+ADMIN** | Read-only reviews list |
| `/dashboard/users` | **ADMIN** | Role promote/demote |
| `/dashboard/profile-requests` | **ADMIN** | Approve email/phone changes |
| `/dashboard/banners` | **ADMIN** | Promo banner management |
| `/dashboard/audit-log` | **ADMIN** | Privileged-write log |
| `/dashboard/settings` | anon-blocked (edits own account) | Currency card is ADMIN-only in-page |

### 8.3 API routes

| Path | Methods | Auth | Purpose |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | Auth.js | Sign-in / session / callbacks |
| `/api/auth/signup` | POST | public, 5/hr per IP | Credentials sign-up (Zod, bcrypt 12, first-user→ADMIN) |
| `/api/auth/verify` | GET | token | Consume verify token, stamp `emailVerified` |
| `/api/auth/forgot-password` | POST | public, 5/hr per IP | Anti-enumeration; always `{ok:true}` |
| `/api/auth/reset-password` | POST | token, 10/hr per IP | Set new hash (bcrypt 12) + audit row |
| `/api/products` | GET | public read-only | Paginated product search (backs the shop) |
| `/api/upload` | POST | **ADMIN/MOD** | Product image upload (4 MB; jpeg/png/webp/gif) |
| `/api/upload/avatar` | POST | any signed-in | Avatar upload (2 MB; jpeg/png/webp) |
| `/api/upload/banner` | POST | **ADMIN** | Banner image upload (6 MB) |

---

## 9. Authentication & authorization

### 9.1 File layout (why it's split)

- **`auth.config.js`** — *edge-safe* config shared by middleware and the Node runtime. **No Prisma /
  bcrypt** here, so they never enter the middleware bundle. Holds OAuth providers + pure callbacks.
- **`lib/auth.js`** — full Node config: spreads `authConfig`, adds the Prisma adapter, the Credentials
  provider, a DB-reading `jwt` callback, and the `createUser` event.
- **`auth.js`** (root) — thin re-export of `handlers, auth, signIn, signOut, hasGoogle, hasFacebook`.
- **`middleware.js`** — builds its own `NextAuth(authConfig)` from the edge-safe config.

### 9.2 Login (credentials)

- The identifier is normalized (`trim().toLowerCase()`) and matched against **`username OR email`**.
- Accounts with no `passwordHash` (OAuth-only) cannot log in via credentials.
- Password checked with `bcrypt.compare`.
- **Brute-force throttle** runs *before* bcrypt: per-account (10 / 15 min) and per-IP (30 / 15 min);
  tripping returns the same generic failure as a wrong password.
- On success the session user is `{ id, email, name, image, role }`.

### 9.3 Sessions (JWT)

- Strategy is **JWT** (no DB sessions; no client `SessionProvider`).
- On sign-in the token is stamped with `role` and `userId`; the `session` callback copies them to
  `session.user`.
- The Node `jwt` callback **re-checks the role against the DB** when forced (`session.update()`), when
  role is missing, or when older than **`ROLE_TTL_MS` = 5 minutes** — so role changes propagate without
  a full re-login (but can be up to 5 minutes stale).

### 9.4 The three authorization layers

1. **Middleware** (`middleware.js`) — matches `/dashboard/:path*` and `/wishlist*`. Anonymous →
   `/unauthorized?next=…` (dashboard) or `/login?next=…` (wishlist). It only knows *signed-in or not*.
2. **Server components / pages** — call `requireAuth()` / `requireRole()` from `lib/auth-helpers.js`
   to enforce the actual role per route.
3. **Server actions & API routes** — **re-check the role again** (defence in depth), even though the
   route is already gated. Self-service actions take the user id from the session, never from client input.

### 9.5 OAuth gating & first admin

- Google/Facebook mount **only** when both `*_CLIENT_ID` and `*_CLIENT_SECRET` are non-empty
  (`hasGoogle` / `hasFacebook`); otherwise the buttons are hidden and no provider is registered.
- Google uses `allowDangerousEmailAccountLinking: true` (Google verifies email); Facebook keeps it
  **off** (takeover risk).
- **First-user-becomes-ADMIN** is centralized in `lib/user-service.js` `promoteIfFirstUser()`, called
  from both the OAuth `createUser` event and credentials signup.

### 9.6 Passwords, tokens, email

- **bcrypt** cost **12** at signup, reset, and seed; **cost 10** in the settings password-change flow
  (an inconsistency — see [§14](#14-security--known-issues--how-to-find-them)).
- **Tokens** (`lib/tokens.js`) are single-use, expire in **1 hour**, stored in `VerificationToken` with
  an `identifier` of `"<purpose>:<email>"`; issuing a new token deletes the prior one.
- **Email** (`lib/mailer.js`) is **dev-only** (console log). Swap the transport for Resend/SMTP/SES in
  production without changing call sites.
- **Email verification is issued but NOT enforced at login.**

---

## 10. Orders, inventory & the checkout critical path

The single most important server action is `placeOrderAction({ billing, items, couponCode })` in
`lib/order-actions.js`. It runs inside one `prisma.$transaction`. Steps:

1. **Validate input (Zod).** `billing` via `BillingSchema`; `items` as `z.array(ItemSchema).min(1)`
   where each item is only `{ slug, qty }` — **the client sends no prices**.
2. **Identify buyer.** `userId = session?.user?.id || null` → **guest checkout allowed**; the order
   still captures email/name/address.
3. **Recompute from the DB (anti-tampering).** Products are re-fetched by slug; **prices and names come
   from the DB**, never the client.
4. **Advisory stock pre-check.** Throws a friendly "out of stock: only N left" early. (Not the real guard.)
5. **Totals in integer cents.** Subtotal = Σ (DB price × qty). Coupons applied from the server-side
   `COUPONS` table; discount clamped so the total can't go negative.
6. **Guarded atomic stock decrement (the real race guard):**
   ```js
   const upd = await tx.product.updateMany({
     where: { id: p.id, stock: { gte: l.qty } },   // only if enough stock remains
     data:  { stock: { decrement: l.qty } },
   });
   if (upd.count === 0) throw new Error(`Out of stock: ${p.name}`); // race lost → rollback
   ```
7. **Create the order** with snapshotted line items (`productSlug`, `productName`, `unitPrice`, `qty`)
   and seed the status timeline with a `PENDING` event.
8. **After commit:** `revalidatePath` for shop + dashboard pages; return
   `{ ok, orderId, number, total, signedIn }` (total converted cents→dollars).

**Rollback semantics:** any thrown error (validation, missing product, stock-out, race loss, or a
duplicate order-number collision) aborts the whole transaction — no order row, no stock change,
nothing partial. The client shows the error as a toast; the cart is cleared **only on success**.

### Inventory rules
- `Product.stock` is the **single source of truth** for availability.
- Stock is **only** decremented through the guarded update above.
- **No automatic restock on cancellation** happens inside `placeOrderAction` (handled elsewhere / TODO).

---

## 11. Money & multi-currency

- **Storage:** all money is **integer minor units** (cents / poisha). MongoDB's Prisma connector has no
  `Decimal`, and integers avoid floating-point drift. `Product.price`, `Order.total`, `OrderItem.unitPrice`,
  etc. are all `Int`.
- **Boundary conversion:** `lib/money.js` — `toCents(dollars)`, `toDollars(cents)` (null-safe),
  `formatMoney(...)`. DB/server math is in cents; the UI works in major units.
- **Base currency = BDT.** `lib/currency.js` defines `CURRENCIES` (BDT rate 1, USD ~121, AED ~33). A
  rate means **base units per 1 unit** of that currency, so 1 USD = 121 BDT.
- **Admin-managed rates.** `StoreConfig` (a single `"store"` row) holds the active currency + rates.
  `updateStoreCurrencyAction` (ADMIN-only) validates a **positive finite** rate (guards divide-by-zero /
  NaN), saves, writes an audit row, and revalidates the layout so all prices re-render immediately.
- **Display conversion happens only at render** (`CurrencyProvider` → `money()` / `moneyMinor()`).
  The stored amounts never change when the display currency changes.

---

## 12. Cart & wishlist

- **State** lives in `lib/CartContext.jsx` (React Context + `useReducer`), persisted to `localStorage`
  under key `ecobazar-cart-v1`. Shape: `{ items:[{slug,name,icon,price,qty}], wishlist:[slug], coupon }`.
- **Guest vs signed-in:**
  - **Guests** keep cart + wishlist in localStorage only. **Wishlist requires sign-in** — a guest
    tapping the heart gets a "please sign in" toast and nothing is added.
  - **Signed-in users** get a **database-backed cart** (`Cart` model, one row per user) via
    `lib/cart-actions.js` (`getCart` / `saveCart` / `mergeCart`), so the cart follows them across devices.
- **Owner tagging (avoids two real bugs).** The local cart is tagged with an `ownerId`, so login can
  tell:
  - *guest just logged in* → **merge** guest cart into the saved cart (sum quantities),
  - *returning user reload* → the **DB is authoritative** (no summing — prevents quantities compounding
    on every reload),
  - *a different user on the same browser* → **discard** the previous cart (no cross-user leak).
- **On logout:** the local cart + wishlist are cleared (safely persisted in the DB, restored next login).
- **Totals** are computed client-side for display only; **checkout always recomputes** authoritatively.
- **Coupons** (`ECO10` 10%, `ECO20` 20%, `FREE5` $5) — see the sync caveat in [§14](#14-security--known-issues--how-to-find-them).

---

## 13. Error handling

Ecobazar uses a **layered, explicit** error strategy rather than a single global boundary.

- **App Router error files:** only `app/not-found.js` exists (the 404 page). There are **no**
  `error.js`, `global-error.js`, or `loading.js` files.
- **Server actions:** two patterns coexist —
  - **Return-shape `{ ok, error }`** where the UI needs to show a message inline (e.g. coupon apply,
    `saveCart`, `placeOrderAction` success payload).
  - **Throw `Error`** for hard failures (e.g. "Product not found.", "You can only edit products you
    created.", stock-out inside the transaction). `requireRole` **redirects** unauthorized users.
- **Zod validation** runs *before* any DB write; `.parse()` throws on bad input.
- **API routes** return proper **HTTP status codes**: `400` invalid input, `401` sign-in required,
  `403` forbidden, `409` duplicate, `413` too large, `415` unsupported type, `429` rate-limited (with
  `Retry-After`). Best-effort side effects (like verification email) are wrapped in swallowing try/catch.
- **Client surfacing:** the **toast system** (in CartContext) shows success/info/error messages; the
  **shop** has an explicit `error` state that renders a red retry panel, plus a separate empty-state,
  and guards against out-of-order fetch responses with a request-id.
- **Loading states:** handled ad-hoc (e.g. the shop dims the grid while fetching); `Suspense` is used
  only around `useSearchParams()` in the login/register/reset-password pages.

---

## 14. Security — known issues & how to find them

Ecobazar is deliberately hardened, but it is a **demo/teaching** codebase with documented gaps. Be
honest about these in any blog post.

### 14.1 Known weaknesses (as of this branch)

| # | Issue | Impact | Where |
|---|---|---|---|
| 1 | **Email verification not enforced** at login | Unverified emails can fully use accounts | `lib/auth.js` `authorize()`, `api/auth/verify` |
| 2 | **Coupon table duplicated** in 2+ places | Displayed discount can drift from charged discount | `CartContext.jsx`, `order-actions.js` |
| 3 | **Guest checkout** allowed | Anonymous orders (by design, but no auth wall) | `order-actions.js` |
| 4 | **In-memory rate limiting** | Bypassable across multiple server instances; IP from spoofable `x-forwarded-for` | `lib/rate-limit.js` |
| 5 | **bcrypt cost inconsistency** (10 vs 12) | Settings-changed passwords hashed weaker | `settings/_actions.js` |
| 6 | **Role can be up to 5 min stale** | Demoted user keeps privileges briefly | `lib/auth.js` `ROLE_TTL_MS` |
| 7 | **First-admin race** | Concurrent first signups could both become admin | `lib/user-service.js` |
| 8 | **Moderator delete gap** | Mods can't delete their own products (asymmetry) | `products/_actions.js` |
| 9 | **Upload MIME trust** | Type checked by client-declared MIME, files under `/public` | `api/upload/*` |
| 10 | **Coupons unlimited-use** | No per-user/order redemption tracking | `order-actions.js` |

### 14.2 How to find security issues (audit checklist)

1. **Run the built-in review:** `/security-review` reviews the pending diff on the current branch.
2. **Verify every dashboard page has a role gate:** grep for `requireRole` / `requireAuth` and confirm
   each `page.js` under `app/dashboard/` calls one.
   ```bash
   grep -rn "requireRole\|requireAuth" app/dashboard
   ```
3. **Verify every mutating server action re-checks role:** open each `_actions.js`; the first lines of a
   privileged action should call `requireRole(...)`.
4. **Check the middleware matcher** (`middleware.js`) — anything sensitive not under `/dashboard` or
   `/wishlist` must be protected in-page.
5. **Confirm money is never trusted from the client:** the checkout item schema should accept only
   `{ slug, qty }` and recompute prices from the DB.
6. **Confirm the stock guard** uses `updateMany({ where: { stock: { gte: qty } } })` with a
   `count === 0` rollback.
7. **Confirm inputs are Zod-validated before writes.**
8. **Confirm privileged writes append an `AuditLog` row.**
9. **Check uploads** for size caps, type allowlists, and hashed filenames (no user-controlled paths).
10. **Check auth endpoints** for rate limiting and anti-enumeration (`forgot-password` always `{ok:true}`).

### 14.3 Suggested hardening (blog "next steps")

- Enforce `emailVerified` at login (or for checkout).
- Extract a single shared `COUPONS` constant used by cart + checkout; add redemption limits.
- Move rate limiting to a shared store (Redis) and trust only your proxy's IP.
- Standardize bcrypt cost to 12 everywhere.
- Add magic-byte sniffing to uploads or serve them from outside `/public`.
- Tighten the first-admin bootstrap with a unique constraint or explicit setup step.

---

## 15. Critical cases & how they are handled

| Critical case | Handling |
|---|---|
| **Two buyers, one last unit** (oversell) | Guarded atomic `updateMany` with `stock >= qty`; `count === 0` → throw → **transaction rollback**. Only one order succeeds. |
| **Client tampers with prices** | Prices/names are **recomputed from the DB** at checkout; client sends only `{slug, qty}`. |
| **Partial failure mid-checkout** | Everything runs in one `$transaction`; any error rolls back **all** of it (no order, no stock change). Cart cleared only on success. |
| **Order number collision** | `number` is `@unique` (ECO- + last 6 epoch digits); a collision throws and rolls back. (Non-monotonic — a known edge case.) |
| **Guest checkout** | `userId` nullable; order captures email/name/address; guest stays on thank-you screen (no dashboard redirect). |
| **Cart double-counting on reload** | Owner-tagged cart: merge only on guest→login; DB authoritative on reload. |
| **Cross-user cart/wishlist leak** | On logout the local cart/wishlist is cleared; a different user's cart is discarded, not merged. |
| **Currency rate = 0 / missing** | `resolveCurrency` falls back to a default rate; admin action rejects non-positive rates — no divide-by-zero/NaN. |
| **Deleted user with a live token** | `jwt` callback is guarded on the DB row, so a deleted user doesn't get a blank privileged token. |
| **Brute-force login** | Per-account + per-IP throttle *before* bcrypt; generic failure message. |
| **Account enumeration via reset** | `forgot-password` always returns `{ok:true}`. |
| **Product edited after purchase** | `OrderItem` snapshots name + unit price, so historical orders never change. |
| **Missing product slug** | Product page soft-404s with nearest-match suggestions; deals page 404s on inactive banner. |

---

## 16. Data model

MongoDB via the Prisma `mongodb` connector. Every model uses `String @id @default(cuid()) @map("_id")`.
**Money is integer cents.** **A replica set is required** (for the checkout transaction).

| Model | Purpose |
|---|---|
| **User** | Accounts; nullable unique `username` + required unique `email`; `passwordHash` (null for OAuth); `role`. |
| **Cart** | Server-side cart, one per user (`userId @unique`); `items`/`coupon` JSON (display prices). |
| **Address** | Saved shipping/billing addresses; `isDefault` managed in app code. |
| **ProfileChangeRequest** | Approval queue for EMAIL/PHONE changes (recovery channels). |
| **Account** / **Session** | Auth.js OAuth links / sessions (strategy is JWT). |
| **VerificationToken** | Email-verification + password-reset tokens. |
| **StoreConfig** | Single row: active display currency + admin exchange rates. |
| **PromoBanner** | Admin promo images per placement (TOP / BELOW_LIST / HOT_DEALS); `targetTag`. |
| **Category** | Catalog categories (slug / name / emoji icon). |
| **Product** | Catalog item; `price`/`oldPrice` cents, `stock`, `tags[]`, `specifications`, `createdById`. |
| **ProductImage** | 0..N images per product; cascade-deleted. |
| **Order** | Order header; friendly `number`, guest-capable, address snapshot, cents money, status enums. |
| **OrderStatusEvent** | Append-only status timeline (first event = PENDING creation). |
| **OrderItem** | Price + name snapshot lines (historical orders immutable). |
| **Review** | Product reviews (1..5), `approved` flag, unique per (product, user). |
| **AuditLog** | Append-only privileged-write log (actor / action / entity / metadata). |

**Enums:** `Role`, `ProfileChangeField`, `ProfileChangeStatus`, `BannerPlacement`, `OrderStatus`
(PENDING/PAID/SHIPPED/DELIVERED/CANCELLED), `PaymentStatus` (UNPAID/PAID/REFUNDED/FAILED),
`PaymentMethod` (COD/PAYPAL/AMAZON/BKASH/NAGAD).

**Two data sources — don't confuse them:**
- **`lib/products-db.js`** — the live DB reads for customer pages (`listProducts`, `getProductBySlug`,
  `listFeatured`, `listBestSellers`, `queryProducts`, `listCategories`, `listProductsByTag`). Source of truth.
- **`lib/data.js`** — the *static* starter catalogue, now used **only** by `prisma/seed.js`. Do not wire
  customer pages back to it.

---

## 17. Configuration & environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MongoDB connection string (must point at a **replica set**). |
| `NEXTAUTH_SECRET` | Session/JWT signing secret. |
| `NEXTAUTH_URL` | Canonical app URL. |
| `AUTH_TRUST_HOST` | Trust the reverse proxy (deployment). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Enable Google login (blank = hidden). |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | Enable Facebook login (blank = hidden). |
| `UPLOAD_DIR` | Product-image upload dir (default `./public/uploads/products`). |
| `UPLOAD_URL_PREFIX` | Public URL prefix for uploads (default `/uploads/products`). |

Other config files:
- **`next.config.mjs`** — `images.minimumCacheTTL: 0` (so overwriting a same-named `/public` image shows
  fresh on reload — retune for production); `allowedDevOrigins` for LAN dev.
- **`postcss.config.mjs`** — the single `@tailwindcss/postcss` plugin (Tailwind v4).
- **`eslint.config.mjs`** — flat config extending `eslint-config-next/core-web-vitals`.
- **`jsconfig.json`** — path alias `@/* → ./*`.

---

## 18. Internationalization & theming

- **i18n** (`lib/i18n/`) — custom, **cookie-based**, currently **English-only** (Bangla was removed;
  plumbing kept). `getT()` serves server components; `useT()` serves client components. Strings live in
  `locales/en.json`. Lookup order: requested locale → English → raw key (never blank); supports
  `{placeholder}` interpolation. Cookie: `ecobazar-lang`.
- **Theme** (`lib/theme/`) — **cookie-based dark mode** with **no flash**: the server reads the
  `ecobazar-theme` cookie and sets `<html class="dark">` before hydration. `ThemeProvider` toggles the
  class + cookie with no reload. Dark mode is class-based; `globals.css` remaps common surface utilities
  (e.g. `.dark .bg-white`).
- Provider nesting (root layout): **Theme → Language → Currency → Cart**.

---

## 19. Testing

- **Playwright** end-to-end tests live in `e2e/` (auth, cart, checkout, storefront, banners).
- Run: `npm run test:e2e` (headless), `npm run test:e2e:ui` (interactive), `npm run test:e2e:report`.
- **There is no unit-test runner** — validation logic is exercised through e2e + manual QA.
- Manual QA aids: the login page's dev quick-fill buttons and the four seeded accounts.

---

## 20. Conventions & contribution rules

These are the load-bearing rules to follow when changing the code:

1. **`.js` = server, `.jsx` = client.** Keep `"use client"` / `"use server"` directives correct.
2. **Validate with Zod** before any DB write.
3. **Enforce roles at every layer** — don't rely on middleware alone; re-check in server actions/APIs.
4. **Preserve the moderator ownership rule** (`createdById === user.id` for edit) when touching product
   mutations.
5. **Append an `AuditLog` row** on every privileged write (actorId / action / entity / entityId / metadata).
6. **Keep the stock guard** (`updateMany` with `stock: { gte: qty }`, `count === 0` → rollback).
7. **Never trust client money** — recompute from the DB at checkout.
8. **Keep the coupon tables in sync** (CartContext + order-actions) — ideally consolidate them.
9. **Money stays in integer cents** in the DB; convert only at the boundary via `lib/money.js`.
10. **Apply schema changes with `db:push`** (not `db:migrate`), then re-seed if needed.

---

## 21. Known limitations & TODOs

- Email verification is **not** enforced.
- Coupon definitions are duplicated and unlimited-use (no redemption tracking).
- Rate limiting is single-instance/in-memory.
- Reviews are **read-only** in the dashboard (approve/reject is a TODO).
- No stock **restock** on order cancellation inside the checkout action.
- Checkout does not persist `city` even though the column exists.
- bcrypt cost differs between flows (10 vs 12).
- Cart-merge-on-login summing is a design choice; there is no per-line "keep max vs sum" toggle.
- No unit test runner; only e2e.
- Email delivery is console-only until a real transport is wired.

---

## 22. FAQ

**Q: What is this project, in one line?**
A role-based organic-grocery e‑commerce store (storefront + admin dashboard) on Next.js 16, Prisma +
MongoDB, and NextAuth v5.

**Q: How do I run it locally?**
Install Node + a MongoDB **replica set**, copy `.env.example` → `.env.local`, then
`npm install && npm run db:push && npm run db:seed && npm run dev`. See [§4](#4-getting-started--how-to-run-it).

**Q: Why does it need a replica set? Can I use a normal MongoDB?**
No. The checkout inventory `$transaction` requires a replica set. Use Atlas or a local single-node
replica set (`?replicaSet=rs0` + `rs.initiate()`).

**Q: What are the test logins?**
`admin/admin`, `mod/mod`, `customer/customer`, `mamun/mamun` (username or email + password). There are
also dev quick-fill buttons on the login page.

**Q: What can a customer do vs an admin?**
See the [capability matrix](#71-capability-matrix). Short version: customers manage only their own
account/orders and use the shop; moderators create/edit their own products; admins control everything.

**Q: Can a moderator delete products?**
No. Moderators can create and edit **their own** products, but **delete is ADMIN-only**.

**Q: How do you prevent overselling / two people buying the last item?**
A guarded atomic stock decrement inside a transaction: `updateMany({ where: { stock: { gte: qty } } })`;
if `count === 0` the transaction rolls back. See [§10](#10-orders-inventory--the-checkout-critical-path).

**Q: Can a user tamper with prices in the cart?**
No. The client sends only `{ slug, qty }`; the server recomputes prices and names from the DB.

**Q: How is money stored? Any floating-point issues?**
Money is stored as **integer minor units** (cents/poisha), so there's no float drift; conversion to
dollars/display currency happens only at the boundary.

**Q: How does multi-currency work?**
Base currency is BDT. An admin sets the active display currency + exchange rates (`StoreConfig`);
display conversion happens at render. Stored amounts never change.

**Q: How is authentication handled?**
NextAuth v5 with a Credentials provider (username **or** email + password), JWT sessions, optional
Google/Facebook, first user auto-promoted to ADMIN. See [§9](#9-authentication--authorization).

**Q: How is authorization enforced?**
Three layers: middleware (signed-in check), server components (`requireRole`), and server actions/APIs
(re-check). Defence in depth.

**Q: How are errors handled?**
Zod validation before writes; server actions throw or return `{ ok, error }`; API routes use HTTP
status codes; the client shows toasts and a shop error state. Only `not-found.js` exists as an
App-Router error file. See [§13](#13-error-handling).

**Q: Where are the security weaknesses and how do I find them?**
See [§14](#14-security--known-issues--how-to-find-them) — it lists the known gaps and a 10-point audit
checklist (including `/security-review`).

**Q: Is email verification required?**
No — it's issued at signup but **not enforced** at login.

**Q: Is guest checkout allowed?**
Yes. Orders can be placed anonymously; the order captures the buyer's email/name/address.

**Q: What happens to my cart when I log in / out?**
Signed-in carts are saved in the DB and follow you across devices. A guest cart merges into your saved
cart on login. On logout the local cart/wishlist is cleared (safe in the DB, restored next login).

**Q: Why is the wishlist empty when I'm not logged in?**
The wishlist is a signed-in-only feature; the page redirects anonymous visitors to `/login`.

**Q: How do I add a product / manage the store?**
Sign in as admin or moderator → `/dashboard/products`. Admins also get Users, Banners, Profile requests,
Audit log, and store currency.

**Q: How do I change the schema?**
Edit `prisma/schema.prisma`, run `npm run db:push` (Mongo has no migrations), then re-seed if needed.

**Q: Is there a test suite?**
Playwright e2e tests (`npm run test:e2e`). No unit-test runner.

**Q: How do I enable Google/Facebook login?**
Set both the client id and secret env vars for that provider; the button appears automatically.

**Q: Is this production-ready?**
It's a strong, security-conscious demo. Before production, address the items in
[§14.3](#143-suggested-hardening-blog-next-steps) and [§21](#21-known-limitations--todos) (real email
transport, shared-store rate limiting, enforced verification, consolidated coupons, upload hardening).

---

## 23. Glossary

- **App Router** — Next.js routing where folders under `app/` are routes; `page.js` renders a route.
- **Server component / Server action** — code that runs on the server; actions (`"use server"`) mutate
  data and are called from the client without a manual API.
- **Middleware** — edge code that runs before a request reaches a route (here: auth gating).
- **JWT session** — session state carried in a signed token, not a DB row.
- **Replica set** — a MongoDB cluster mode that supports multi-document transactions.
- **Minor units / cents** — the smallest currency unit (e.g. 1499 = $14.99) used for exact money math.
- **Audit log** — an append-only record of privileged writes for accountability.
- **RBAC** — role-based access control (CUSTOMER / MODERATOR / ADMIN here).
- **Anti-enumeration** — not revealing whether an account exists (e.g. password reset always succeeds).

---

*Generated from a full read of the codebase on the `feature/auth-hardening` branch. When code changes,
update the affected section — treat this file as living documentation.*
