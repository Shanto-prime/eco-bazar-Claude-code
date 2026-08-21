# Ecobazar Project Documentation

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
4. [Getting started how to run it](#4-getting-started--how-to-run-it)
5. [Project structure](#5-project-structure)
6. [Feature list what is built](#6-feature-list--what-is-built)
7. [User roles & permissions](#7-user-roles--permissions)
8. [Route reference](#8-route-reference)
9. [Authentication & authorization](#9-authentication--authorization)
10. [Orders, inventory & the checkout critical path](#10-orders-inventory--the-checkout-critical-path)
11. [Money & pricing](#11-money--pricing)
12. [Cart & wishlist](#12-cart--wishlist)
13. [Error handling](#13-error-handling)
14. [Security known issues & how to find them](#14-security--known-issues--how-to-find-them)
15. [Critical cases & how they are handled](#15-critical-cases--how-they-are-handled)
16. [Data model](#16-data-model)
17. [Configuration & environment variables](#17-configuration--environment-variables)
18. [Internationalization & theming](#18-internationalization--theming)
19. [Testing](#19-testing)
20. [Conventions & contribution rules](#20-conventions--contribution-rules)
21. [Known limitations & TODOs](#21-known-limitations--todos)
22. [FAQ](#22-faq)
23. [Glossary](#23-glossary)
24. [Deployment VPS + GitHub Actions auto-deploy](#24-deployment--vps--github-actions-auto-deploy)

---

## 1. What Ecobazar is

Ecobazar is a **full-stack e‑commerce store for organic groceries**. It has two faces living on the
**same domain**:

- **Storefront** the public shop: browse, search, filter, product detail, cart, wishlist, checkout
  (guest or signed‑in), promo/deal landing pages.
- **Dashboard** (`/dashboard`) a **role-based admin area** for managing products, orders, users,
  reviews, promo banners, profile-change approvals, store currency, and an audit log.

It is built on **Next.js 16 (App Router) + React 19**, **Prisma + MongoDB**, **NextAuth v5 (Auth.js)**,
**Tailwind CSS v4**, and **Zod** for validation. Money is **BDT-only** all prices are stored, computed,
and displayed in Taka (৳). (Multi-currency display was removed; the plumbing is dormant, see [§11](#11-money--pricing).)

---

## 2. Why this project is good

- **Defence-in-depth authorization.** Access control is enforced at **three independent layers**
  (middleware → server components → server actions/API). No single layer is trusted alone.
- **Anti-tampering checkout.** Prices and names are **recomputed from the database** at checkout  
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
- **Money correctness.** All money is stored as **integer minor units (cents/poisha)** no floating
  point drift and converted only at display boundaries.
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

- **No `engines` field** and **no `tsconfig.json`** this is a **JavaScript** project (not TypeScript).
- **No `tailwind.config.js`** Tailwind v4 keeps its config in CSS (`app/globals.css`).
- **No unit-test runner** only Playwright end-to-end tests exist.
- `postinstall` runs `prisma generate`, so the Prisma client is regenerated on every `npm install`.

---

## 4. Getting started how to run it

### 4.1 Prerequisites

1. **Node.js** (a current LTS; the repo declares no specific version).
2. **A MongoDB replica set.** This is **mandatory** the checkout inventory transaction cannot run
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

OAuth (Google/Facebook) is **optional** leave those keys blank and the buttons simply don't appear.

### 4.3 Install, seed, run

```bash
npm install          # also runs `prisma generate` via postinstall
npm run db:push      # sync the Prisma schema to MongoDB (NOT db:migrate   Mongo has no migrations)
npm run db:seed      # seed test users, categories, products, demo products, promo banners
npm run dev          # dev server on http://0.0.0.0:3000
```

Build & serve production:

```bash
npm run build        # runs `prisma generate` then `next build`
npm start
```

### 4.4 All npm scripts

| Script                         | Command                         | Purpose                                        |
| ------------------------------ | ------------------------------- | ---------------------------------------------- |
| `dev`                          | `next dev --hostname 0.0.0.0`   | Dev server (host pinned for LAN access)        |
| `build`                        | `prisma generate && next build` | Production build                               |
| `start`                        | `next start`                    | Serve the production build                     |
| `lint`                         | `eslint`                        | Lint                                           |
| `db:push`                      | `prisma db push`                | **The** way to apply schema changes on MongoDB |
| `db:migrate`                   | `prisma migrate dev`            | **NOT supported on MongoDB** use `db:push`     |
| `db:studio`                    | `prisma studio`                 | Visual DB browser                              |
| `db:seed`                      | `node prisma/seed.js`           | Seed the database                              |
| `test:e2e` / `:ui` / `:report` | Playwright                      | End-to-end tests                               |

### 4.5 Seeded test logins

Sign in at `/login` with the **username or the email**, plus the password. On the login page there
are also **dev quick-fill buttons** (Admin / Mod / Customer 1 / Customer 2) that populate the form.

| Username   | Email                    | Password   | Role      |
| ---------- | ------------------------ | ---------- | --------- |
| `admin`    | `admin@ecobazar.test`    | `admin`    | ADMIN     |
| `mod`      | `mod@ecobazar.test`      | `mod`      | MODERATOR |
| `customer` | `customer@ecobazar.test` | `customer` | CUSTOMER  |
| `mamun`    | `mamun@ecobazar.test`    | `mamun`    | CUSTOMER  |

> The seed creates **12 categories**, a **59-product Bangladeshi organic-grocery catalogue** (all
> EcoBazar own-brand no third-party trademarks in slugs, names or the `brand` field), **star
> ratings** deterministically spread across all products so the shop's rating filter has candidates
> at every level, real product photos under `public/uploads/products/<slug>.jpeg`, a 3-image
> gallery on `soybean-oil-5l` for testing the product-detail gallery, and 2 promo banners
> (TOP + BELOW_LIST) + 2 live Hot Deals offers. It is idempotent (`upsert` everywhere) safe to
> re-run.

### 4.6 Production seed

Use `npm run db:seed:prod` for a fresh production install it refuses to run without
`SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` env vars (min 8 chars, warns below 12), never creates
the four dev test accounts, and can wipe existing catalogue rows with `SEED_WIPE_EXISTING=true`:

```bash
SEED_ADMIN_EMAIL=you@example.com \
SEED_ADMIN_PASSWORD='<strong-password>' \
SEED_ADMIN_USERNAME=admin \
npm run db:seed:prod
```

Idempotent: re-running updates the admin's password/name/role in place. Refuses to demote an
existing super-admin if someone else already owns the flag, the new email is created as ADMIN
without super status. See `prisma/seed.prod.js`.

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

## 6. Feature list what is built

### Storefront (customer-facing)

- **Home page** hero (3-card grid: main + admin-managed TOP promo banner + Hot-Deals link),
  service bar, category grid, **Popular Products (best-sellers)** with a "See More" button, Hot
  Deals area, admin-managed BELOW_LIST promo banner, featured products, and a **Customer Reviews**
  carousel (6 seeded reviews 4× 5-star, 2× 4-star). _(The Sale-of-the-Month, Latest News, Brand
  Strip and Follow-Us-On-Instagram sections that used to sit above the footer have been removed  
  they were placeholder content only. See changelog / commit history if you need to restore them.)_
- **Primary nav** Home · Shop · Pages · **Track Order** (→ `/orders/lookup`) · About · Contact.
- **Shop** **server-side paginated** product grid (9/page), live search by name, category filter,
  **price range slider bounded by the actual cheapest/most-expensive products in the DB** (via
  `getPriceBounds()` in `lib/products-db.js`), rating filter (radios at 5★/4★/3★/2★/1★, hitting
  `Product.rating >= n`), and sort (latest / price / name). Deep-linkable via `?q=` and `?cat=`.
  Prices displayed in Taka (৳).
- **Product detail** image gallery with zoom (supports multi-image galleries via `<slug>-2.jpeg`,
  `<slug>-3.jpeg` filename convention), quantity stepper, add-to-cart, wishlist toggle,
  description/additional-info/reviews tabs, related products, soft‑404 with nearest-match suggestions.
- **Cart** quantity steppers, coupon apply, live totals; desktop table / mobile cards.
- **Wishlist** **signed-in only** (guests are redirected to login); saved items resolved against the DB.
- **Checkout** billing form (Bangladeshi Division/District/Thana selects), address prefill for
  signed-in users, **guest checkout supported**, multiple payment methods (COD/PayPal/Amazon/bKash/
  Nagad), coupon, thank-you screen.
- **Order lookup / Tracker** (`/orders/lookup`) guest can enter their order number + email to see
  status; signed-in users are redirected to `/dashboard/orders`.
- **Deals pages** (`/deals/<slug>`) promo landing pages listing only products matching a banner's tag,
  with a copy-code control.
- **Contact** client-validated contact form + map placeholder.
- **Theme toggle** (light/dark). _(Multi-currency display was removed the store is BDT-only.)_

### Accounts & auth

- Credentials sign-up / sign-in (username **or** email), password reset, email verification (issued,
  not enforced), optional Google/Facebook OAuth, first-ever user auto-promoted to ADMIN.
- **Already-signed-in guardrails.** Hitting `/login` or `/register` while signed in shows a
  "you're already signed in as X" panel with continue-to-destination and sign-out links, never the
  form. `/unauthorized` branches the same way: signed-in users see "you don't have access to this
  page" (no misleading login CTA), anonymous users still get the log-in / create-account buttons.
- **Guest → user order linking.** When a customer who bought as a guest later opens an account with
  the same email, all their prior guest orders are attached to the new account automatically
  (`claimGuestOrdersForUser` in `lib/user-service.js`, called from both the credentials signup
  route and the OAuth `createUser` event). Match is case-insensitive so a mis-cased email at
  checkout doesn't strand the order.

### Dashboard (role-based)

- **Overview** (role-specific dashboard), **Orders** (scoped by role, with an inline items list +
  status timeline + customer's own return/review actions see [§10](#10-orders-inventory--the-checkout-critical-path)),
  **Products** (CRUD with moderator ownership), **Reviews** (read), **Users** (role management,
  ADMIN), **Profile requests** (email/phone change approvals, ADMIN), **Banners** (promo management,
  ADMIN), **Audit log** (ADMIN), **Settings** (profile / password / addresses / appearance).
  _(The store-currency card was removed when the project went BDT-only.)_

### Platform

- Image uploads (product / avatar / banner) with size + type limits and hashed filenames.
- Audit logging on privileged writes; append-only order status timeline.
- Cookie-based i18n (English) and dark-mode theme with no-flash SSR.

---

## 7. User roles & permissions

There are three roles: **CUSTOMER** (default), **MODERATOR**, **ADMIN**. Role is carried in the JWT
(`session.user.role`) and re-verified against the DB at most every 5 minutes.

### 7.1 Capability matrix

| Capability                                       |    Customer    |            Moderator             |      Admin       |
| ------------------------------------------------ | :------------: | :------------------------------: | :--------------: |
| Browse shop, product detail, deals               |       ✅       |                ✅                |        ✅        |
| Add to cart / checkout (incl. as guest)          |       ✅       |                ✅                |        ✅        |
| Use wishlist                                     | ✅ (signed in) |                ✅                |        ✅        |
| Place & view **own** orders                      |       ✅       |                ✅                |        ✅        |
| See ordered items + prices in order details      |       ✅       |                ✅                |        ✅        |
| **Request return within 15 days** of DELIVERED   | ✅ (own order) |             ✅ (own)             |     ✅ (own)     |
| **Write a review** on a delivered order's items  | ✅ (own order) |             ✅ (own)             |     ✅ (own)     |
| Access `/dashboard`                              |  ✅ (limited)  |                ✅                |        ✅        |
| Dashboard: Overview, own Orders, Settings        |       ✅       |                ✅                |        ✅        |
| Upload own avatar                                |       ✅       |                ✅                |        ✅        |
| View **all** orders                              |       ❌       |          ✅ (read-only)          | ✅ (edit status) |
| Change order status (except DELIVERED/CANCELLED) |       ❌       | ✅ (cancel needs admin approval) |        ✅        |
| Create products                                  |       ❌       |                ✅                |        ✅        |
| Edit / upload product images                     |       ❌       |         ✅ **own only**          |      ✅ any      |
| Delete products                                  |       ❌       |                ❌                |        ✅        |
| View Reviews list                                |       ❌       |                ✅                |        ✅        |
| Manage Users (promote/demote roles)              |       ❌       |                ❌                |        ✅        |
| Approve email/phone change requests              |       ❌       |                ❌                |        ✅        |
| Manage promo Banners                             |       ❌       |                ❌                |        ✅        |
| View Audit Log                                   |       ❌       |                ❌                |        ✅        |

### 7.2 Role notes & rules (the "rule book")

- **Customer** can only manage **their own** account and **their own** orders. They never see other
  users' data. Wishlist requires being signed in.
- **Moderator ownership rule:** a moderator may **create** products and **edit** only products where
  `Product.createdById === user.id`. Editing someone else's product throws
  `"You can only edit products you created."` **Delete is ADMIN-only** a moderator cannot delete even
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

| Path                                 | File                        | Notes                                                                                                                                                                                                                                        |
| ------------------------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                  | `app/page.js`               | Home (server). Best-seller popular products from DB.                                                                                                                                                                                         |
| `/shop`                              | `app/shop/page.js`          | Server renders first 9; `ShopClient` paginates via `/api/products`.                                                                                                                                                                          |
| `/shop/[slug]`                       | `app/shop/[slug]/page.js`   | Product detail; soft-404 with suggestions.                                                                                                                                                                                                   |
| `/cart`                              | `app/cart/page.js`          | Client; wired to CartContext.                                                                                                                                                                                                                |
| `/checkout`                          | `app/checkout/page.js`      | Prefills address for signed-in; guests allowed.                                                                                                                                                                                              |
| `/wishlist`                          | `app/wishlist/page.js`      | **Protected** anon → `/login?next=/wishlist` (middleware).                                                                                                                                                                                   |
| `/deals/[slug]`                      | `app/deals/[slug]/page.js`  | Promo landing; inactive banner → 404.                                                                                                                                                                                                        |
| `/contact`                           | `app/contact/page.js`       | Client-validated form.                                                                                                                                                                                                                       |
| `/login` `/register`                 | `app/login`, `app/register` | Auth forms; OAuth buttons only if configured. **Signed-in visitors see a "you're already signed in as X" panel with continue + sign-out links instead of the form** (checked server-side in `page.jsx`).                                     |
| `/forgot-password` `/reset-password` |                             | Password reset flow (token in `?token=`).                                                                                                                                                                                                    |
| `/orders/lookup`                     | `app/orders/lookup/page.js` | Guest order tracker enter order number + email. Signed-in users are pushed to `/dashboard/orders`. Wired to the "Track Order" primary-nav item.                                                                                              |
| `/unauthorized`                      | `app/unauthorized/page.jsx` | Access-denied. **Branches on session**: signed-in users see "you don't have access to this page" (offer dashboard/home links, no misleading login CTA); anonymous visitors see the log-in / create-account buttons and a `?next=` deep-link. |
| `*` (404)                            | `app/not-found.js`          | 404 page.                                                                                                                                                                                                                                    |

### 8.2 Dashboard routes

Whole subtree gated by `requireAuth()` in `app/dashboard/layout.js` (defence-in-depth behind middleware).

| Path                            | Role gate                          | Description                                                                    |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| `/dashboard`                    | anon-blocked → role router         | ADMIN/MOD/CUSTOMER see different dashboards                                    |
| `/dashboard/orders`             | anon-blocked (data scoped in-code) | Customer=own; Mod=all read-only; Admin=all + status edit                       |
| `/dashboard/products`           | **MOD+ADMIN**                      | Mod sees own; Admin sees all                                                   |
| `/dashboard/products/new`       | **MOD+ADMIN**                      | Create product                                                                 |
| `/dashboard/products/[id]/edit` | **MOD+ADMIN**                      | Edit (own-only for Mod); delete Admin-only                                     |
| `/dashboard/reviews`            | **MOD+ADMIN**                      | Read-only reviews list                                                         |
| `/dashboard/users`              | **ADMIN**                          | Role promote/demote                                                            |
| `/dashboard/profile-requests`   | **ADMIN**                          | Approve email/phone changes                                                    |
| `/dashboard/banners`            | **ADMIN**                          | Promo banner management                                                        |
| `/dashboard/audit-log`          | **ADMIN**                          | Privileged-write log                                                           |
| `/dashboard/settings`           | anon-blocked (edits own account)   | Profile / password / addresses / appearance. Currency card removed (BDT-only). |

### 8.3 API routes

| Path                        | Methods   | Auth                | Purpose                                                |
| --------------------------- | --------- | ------------------- | ------------------------------------------------------ |
| `/api/auth/[...nextauth]`   | GET, POST | Auth.js             | Sign-in / session / callbacks                          |
| `/api/auth/signup`          | POST      | public, 5/hr per IP | Credentials sign-up (Zod, bcrypt 12, first-user→ADMIN) |
| `/api/auth/verify`          | GET       | token               | Consume verify token, stamp `emailVerified`            |
| `/api/auth/forgot-password` | POST      | public, 5/hr per IP | Anti-enumeration; always `{ok:true}`                   |
| `/api/auth/reset-password`  | POST      | token, 10/hr per IP | Set new hash (bcrypt 12) + audit row                   |
| `/api/products`             | GET       | public read-only    | Paginated product search (backs the shop)              |
| `/api/upload`               | POST      | **ADMIN/MOD**       | Product image upload (4 MB; jpeg/png/webp/gif)         |
| `/api/upload/avatar`        | POST      | any signed-in       | Avatar upload (2 MB; jpeg/png/webp)                    |
| `/api/upload/banner`        | POST      | **ADMIN**           | Banner image upload (6 MB)                             |

---

## 9. Authentication & authorization

### 9.1 File layout (why it's split)

- **`auth.config.js`** _edge-safe_ config shared by middleware and the Node runtime. **No Prisma /
  bcrypt** here, so they never enter the middleware bundle. Holds OAuth providers + pure callbacks.
- **`lib/auth.js`** full Node config: spreads `authConfig`, adds the Prisma adapter, the Credentials
  provider, a DB-reading `jwt` callback, and the `createUser` event.
- **`auth.js`** (root) thin re-export of `handlers, auth, signIn, signOut, hasGoogle, hasFacebook`.
- **`middleware.js`** builds its own `NextAuth(authConfig)` from the edge-safe config.

### 9.2 Login (credentials)

- The identifier is normalized (`trim().toLowerCase()`) and matched against **`username OR email`**.
- Accounts with no `passwordHash` (OAuth-only) cannot log in via credentials.
- Password checked with `bcrypt.compare`.
- **Brute-force throttle** runs _before_ bcrypt: per-account (10 / 15 min) and per-IP (30 / 15 min);
  tripping returns the same generic failure as a wrong password.
- On success the session user is `{ id, email, name, image, role }`.

### 9.3 Sessions (JWT)

- Strategy is **JWT** (no DB sessions; no client `SessionProvider`).
- On sign-in the token is stamped with `role` and `userId`; the `session` callback copies them to
  `session.user`.
- The Node `jwt` callback **re-checks the role against the DB** when forced (`session.update()`), when
  role is missing, or when older than **`ROLE_TTL_MS` = 5 minutes** so role changes propagate without
  a full re-login (but can be up to 5 minutes stale).

### 9.4 The three authorization layers

1. **Middleware** (`middleware.js`) matches `/dashboard/:path*` and `/wishlist*`. Anonymous →
   `/unauthorized?next=…` (dashboard) or `/login?next=…` (wishlist). It only knows _signed-in or not_.
2. **Server components / pages** call `requireAuth()` / `requireRole()` from `lib/auth-helpers.js`
   to enforce the actual role per route.
3. **Server actions & API routes** **re-check the role again** (defence in depth), even though the
   route is already gated. Self-service actions take the user id from the session, never from client input.

### 9.5 OAuth gating & first admin

- Google/Facebook mount **only** when both `*_CLIENT_ID` and `*_CLIENT_SECRET` are non-empty
  (`hasGoogle` / `hasFacebook`); otherwise the buttons are hidden and no provider is registered.
- Google uses `allowDangerousEmailAccountLinking: true` (Google verifies email); Facebook keeps it
  **off** (takeover risk).
- **First-user-becomes-ADMIN** is centralized in `lib/user-service.js` `promoteIfFirstUser()`, called
  from both the OAuth `createUser` event and credentials signup.
- **Guest orders → new account.** Same file, `claimGuestOrdersForUser(userId, email)` runs after
  every signup (credentials + OAuth). Finds every order with matching email and `userId=null`, sets
  `userId=userId`. Case-insensitive equal on email. Never throws a failure here doesn't block the
  signup response.

### 9.6 Passwords, tokens, email

- **bcrypt** cost **12** at signup, reset, and seed; **cost 10** in the settings password-change flow
  (an inconsistency see [§14](#14-security--known-issues--how-to-find-them)).
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
   where each item is only `{ slug, qty }` **the client sends no prices**.
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
        where: { id: p.id, stock: { gte: l.qty } }, // only if enough stock remains
        data: { stock: { decrement: l.qty } },
    });
    if (upd.count === 0) throw new Error(`Out of stock: ${p.name}`); // race lost → rollback
    ```
7. **Create the order** with snapshotted line items (`productSlug`, `productName`, `unitPrice`, `qty`)
   and seed the status timeline with a `PENDING` event.
8. **After commit:** `revalidatePath` for shop + dashboard pages; return
   `{ ok, orderId, number, total, signedIn }` (total converted cents→dollars).

**Rollback semantics:** any thrown error (validation, missing product, stock-out, race loss, or a
duplicate order-number collision) aborts the whole transaction no order row, no stock change,
nothing partial. The client shows the error as a toast; the cart is cleared **only on success**.

### Inventory rules

- `Product.stock` is the **single source of truth** for availability.
- Stock is **only** decremented through the guarded update above.
- **Cancellation returns stock** via `restockCancelledOrder(tx, orderId)` (`lib/inventory.js`),
  called from BOTH the admin/mod status-change path (`updateOrderStatusAction`) and the customer
  return path (`requestReturnAction`), in the same transaction as the status flip so the two can
  never disagree. Terminal states (`CANCELLED`) can only be entered once, so no double-crediting.

### Terminal statuses + the customer return flow

`DELIVERED` and `CANCELLED` are **terminal** (`lib/order-status.js` `TERMINAL_STATUSES`). The admin
`StatusSelect` disables the dropdown, and `updateOrderStatusAction` rejects the change server-side
(defence in depth). There is **one** allowed exit from `DELIVERED`: the customer's own return
request.

- **`requestReturnAction`** (`app/dashboard/orders/_customer-actions.js`) is customer-callable
  (`requireAuth`, not `requireRole`). Eligibility check in `lib/order-return.js`
  `canRequestReturn({viewerId, order, now})` verifies:
    - `viewerId === order.userId` (the buyer must be signed in guest orders can only be returned
      after the guest→user linking claims the order),
    - `order.status === "DELIVERED"`,
    - `now < deliveredAt + 15 days` (`RETURN_WINDOW_DAYS = 15`, reads the first `DELIVERED` event on
      the order's timeline).
- On success: `Order.status` → `CANCELLED`, stock restocked, `OrderStatusEvent` written with
  `note: "Return requested by customer"` and `actorId = user.id`, `AuditLog` row appended.
- After the 15-day window the button hides; the order stays `DELIVERED` permanently.
- The order-details modal reads the pre-computed `canReturn` boolean + `returnDeadline` from the
  server page so no client-side auth logic is needed.

### Reviews on delivered orders

- **`submitReviewAction`** (same file). Customer-callable. Requires ownership, `DELIVERED` status,
  the product to appear as one of the order's `OrderItem`s, and no existing review by this user
  for this product (`Review.@@unique([productId, userId])`).
- Reviews are **auto-approved** for now the schema has `Review.approved` but no admin
  moderation UI is wired up. On write, the action recomputes `Product.rating` as the running
  average of approved reviews (rounded to one decimal, matches `ProductCard`).
- The order-details modal shows a per-item "Write review" CTA that expands into a rating + text
  form, or a "You reviewed this" badge for items already reviewed. `reviewedProductIds` is
  fetched once per page render (single Prisma query joined across all products in the current
  order list) so no per-item round-trip is needed.

---

## 11. Money & pricing

The store is **BDT-only**. All money is stored, computed, and displayed in Taka (৳). Multi-currency
support was removed; the plumbing was left in the tree as dormant code (see [§11.2](#112-multi-currency-plumbing-is-dormant-not-deleted)).

### 11.1 The rules that still apply

- **Storage:** all money is **integer minor units** poisha here, 1/100 of a Taka.
  MongoDB's Prisma connector has no `Decimal`, and integers avoid floating-point drift.
  `Product.price`, `Order.total`, `OrderItem.unitPrice`, etc. are all `Int`.
- **Boundary conversion:** `lib/money.js` `toCents(taka)`, `toDollars(cents)` (null-safe),
  `formatMoney(...)`. DB/server math is in poisha; the UI works in Taka.
- **Base currency = BDT** (`lib/currency.js` `BASE_CURRENCY`). Display formatter always uses ৳
  with 2 decimal places.
- **Shop price-range slider** is bounded by the actual cheapest/most-expensive `Product.price`
  in the DB via `getPriceBounds()` in `lib/products-db.js`, labelled in ৳.

### 11.2 Multi-currency plumbing is dormant, not deleted

- `lib/store-config.js` `getActiveCurrency()` unconditionally returns BDT. `getStoreConfig()`
  returns `{ currency: "BDT", rates: {} }` without hitting the DB. `saveStoreConfig()` is a
  no-op shim (kept exported so the old admin action import doesn't 500).
- `lib/currency.js` still defines USD/AED presets and `resolveCurrency`. `CurrencyProvider`
  still wraps the app in `layout.js`. Nothing surfaces to the UI.
- The **admin store-currency card was removed** from `/dashboard/settings`.
- If you ever re-enable multi-currency: revert `lib/store-config.js` to read from the DB and
  re-add `<StoreCurrencySettings />` to the settings page. The `StoreConfig.currency` and
  `StoreConfig.rates` fields are still in the schema, and the row (if any) is preserved.

---

## 12. Cart & wishlist

- **State** lives in `lib/CartContext.jsx` (React Context + `useReducer`), persisted to `localStorage`
  under key `ecobazar-cart-v1`. Shape: `{ items:[{slug,name,icon,price,qty}], wishlist:[slug], coupon }`.
- **Guest vs signed-in:**
    - **Guests** keep cart + wishlist in localStorage only. **Wishlist requires sign-in** a guest
      tapping the heart gets a "please sign in" toast and nothing is added.
    - **Signed-in users** get a **database-backed cart** (`Cart` model, one row per user) via
      `lib/cart-actions.js` (`getCart` / `saveCart` / `mergeCart`), so the cart follows them across devices.
- **Owner tagging (avoids two real bugs).** The local cart is tagged with an `ownerId`, so login can
  tell:
    - _guest just logged in_ → **merge** guest cart into the saved cart (sum quantities),
    - _returning user reload_ → the **DB is authoritative** (no summing prevents quantities compounding
      on every reload),
    - _a different user on the same browser_ → **discard** the previous cart (no cross-user leak).
- **On logout:** the local cart + wishlist are cleared (safely persisted in the DB, restored next login).
- **Totals** are computed client-side for display only; **checkout always recomputes** authoritatively.
- **Coupons** (`ECO10` 10%, `ECO20` 20%, `FREE5` $5) see the sync caveat in [§14](#14-security--known-issues--how-to-find-them).

---

## 13. Error handling

Ecobazar uses a **layered, explicit** error strategy rather than a single global boundary.

- **App Router error files:** only `app/not-found.js` exists (the 404 page). There are **no**
  `error.js`, `global-error.js`, or `loading.js` files.
- **Server actions:** two patterns coexist
    - **Return-shape `{ ok, error }`** where the UI needs to show a message inline (e.g. coupon apply,
      `saveCart`, `placeOrderAction` success payload).
    - **Throw `Error`** for hard failures (e.g. "Product not found.", "You can only edit products you
      created.", stock-out inside the transaction). `requireRole` **redirects** unauthorized users.
- **Zod validation** runs _before_ any DB write; `.parse()` throws on bad input.
- **API routes** return proper **HTTP status codes**: `400` invalid input, `401` sign-in required,
  `403` forbidden, `409` duplicate, `413` too large, `415` unsupported type, `429` rate-limited (with
  `Retry-After`). Best-effort side effects (like verification email) are wrapped in swallowing try/catch.
- **Client surfacing:** the **toast system** (in CartContext) shows success/info/error messages; the
  **shop** has an explicit `error` state that renders a red retry panel, plus a separate empty-state,
  and guards against out-of-order fetch responses with a request-id.
- **Loading states:** handled ad-hoc (e.g. the shop dims the grid while fetching); `Suspense` is used
  only around `useSearchParams()` in the login/register/reset-password pages.

---

## 14. Security known issues & how to find them

Ecobazar is deliberately hardened, but it is a **demo/teaching** codebase with documented gaps. Be
honest about these in any blog post.

### 14.1 Known weaknesses (as of this branch)

| #   | Issue                                        | Impact                                                                           | Where                                          |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | **Email verification not enforced** at login | Unverified emails can fully use accounts                                         | `lib/auth.js` `authorize()`, `api/auth/verify` |
| 2   | **Coupon table duplicated** in 2+ places     | Displayed discount can drift from charged discount                               | `CartContext.jsx`, `order-actions.js`          |
| 3   | **Guest checkout** allowed                   | Anonymous orders (by design, but no auth wall)                                   | `order-actions.js`                             |
| 4   | **In-memory rate limiting**                  | Bypassable across multiple server instances; IP from spoofable `x-forwarded-for` | `lib/rate-limit.js`                            |
| 5   | **bcrypt cost inconsistency** (10 vs 12)     | Settings-changed passwords hashed weaker                                         | `settings/_actions.js`                         |
| 6   | **Role can be up to 5 min stale**            | Demoted user keeps privileges briefly                                            | `lib/auth.js` `ROLE_TTL_MS`                    |
| 7   | **First-admin race**                         | Concurrent first signups could both become admin                                 | `lib/user-service.js`                          |
| 8   | **Moderator delete gap**                     | Mods can't delete their own products (asymmetry)                                 | `products/_actions.js`                         |
| 9   | **Upload MIME trust**                        | Type checked by client-declared MIME, files under `/public`                      | `api/upload/*`                                 |
| 10  | **Coupons unlimited-use**                    | No per-user/order redemption tracking                                            | `order-actions.js`                             |

### 14.2 How to find security issues (audit checklist)

1. **Run the built-in review:** `/security-review` reviews the pending diff on the current branch.
2. **Verify every dashboard page has a role gate:** grep for `requireRole` / `requireAuth` and confirm
   each `page.js` under `app/dashboard/` calls one.
    ```bash
    grep -rn "requireRole\|requireAuth" app/dashboard
    ```
3. **Verify every mutating server action re-checks role:** open each `_actions.js`; the first lines of a
   privileged action should call `requireRole(...)`.
4. **Check the middleware matcher** (`middleware.js`) anything sensitive not under `/dashboard` or
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

| Critical case                                        | Handling                                                                                                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Two buyers, one last unit** (oversell)             | Guarded atomic `updateMany` with `stock >= qty`; `count === 0` → throw → **transaction rollback**. Only one order succeeds.                                                               |
| **Client tampers with prices**                       | Prices/names are **recomputed from the DB** at checkout; client sends only `{slug, qty}`.                                                                                                 |
| **Partial failure mid-checkout**                     | Everything runs in one `$transaction`; any error rolls back **all** of it (no order, no stock change). Cart cleared only on success.                                                      |
| **Order number collision**                           | `number` is `@unique` (ECO- + last 6 epoch digits); a collision throws and rolls back. (Non-monotonic a known edge case.)                                                                 |
| **Guest checkout**                                   | `userId` nullable; order captures email/name/address; guest stays on thank-you screen (no dashboard redirect).                                                                            |
| **Guest → user account link**                        | On signup (credentials + OAuth), `claimGuestOrdersForUser` binds all `userId=null` orders whose email matches (case-insensitive) to the new account.                                      |
| **Cart double-counting on reload**                   | Owner-tagged cart: merge only on guest→login; DB authoritative on reload.                                                                                                                 |
| **Cross-user cart/wishlist leak**                    | On logout the local cart/wishlist is cleared; a different user's cart is discarded, not merged.                                                                                           |
| **Return requested past 15 days**                    | `canRequestReturn` returns `{ok:false, reason:"windowClosed"}`, the UI hides the button, and the server action rejects the mutation.                                                      |
| **Admin tries to reopen a DELIVERED order**          | `TERMINAL_STATUSES` blocks it server rejects, UI disables the picker. Only exception is the customer's own return within 15 days, which goes through the dedicated `requestReturnAction`. |
| **Customer reviews the same product twice**          | Prisma `@@unique([productId, userId])` on `Review` rejects the second insert; the action catches it and returns a "you've already reviewed this" error.                                   |
| **Deleted user with a live token**                   | `jwt` callback is guarded on the DB row, so a deleted user doesn't get a blank privileged token.                                                                                          |
| **Brute-force login**                                | Per-account + per-IP throttle _before_ bcrypt; generic failure message.                                                                                                                   |
| **Account enumeration via reset**                    | `forgot-password` always returns `{ok:true}`.                                                                                                                                             |
| **Product edited after purchase**                    | `OrderItem` snapshots name + unit price, so historical orders never change.                                                                                                               |
| **Missing product slug**                             | Product page soft-404s with nearest-match suggestions; deals page 404s on inactive banner.                                                                                                |
| **Already signed-in visits `/login` or `/register`** | Server-side session check swaps the form for a "you're already signed in as X" panel with a continue link and a sign-out link.                                                            |

---

## 16. Data model

MongoDB via the Prisma `mongodb` connector. Every model uses `String @id @default(cuid()) @map("_id")`.
**Money is integer cents.** **A replica set is required** (for the checkout transaction).

| Model                     | Purpose                                                                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**                  | Accounts; nullable unique `username` + required unique `email`; `passwordHash` (null for OAuth); `role`.                                                                                                              |
| **Cart**                  | Server-side cart, one per user (`userId @unique`); `items`/`coupon` JSON (display prices).                                                                                                                            |
| **Address**               | Saved shipping/billing addresses; `isDefault` managed in app code.                                                                                                                                                    |
| **ProfileChangeRequest**  | Approval queue for EMAIL/PHONE changes (recovery channels).                                                                                                                                                           |
| **Account** / **Session** | Auth.js OAuth links / sessions (strategy is JWT).                                                                                                                                                                     |
| **VerificationToken**     | Email-verification + password-reset tokens.                                                                                                                                                                           |
| **StoreConfig**           | Single row (`_id: "store"`): active display currency + admin exchange rates. **Currently unused** the store is BDT-only and `getActiveCurrency()` ignores this row. Fields kept in the schema for a future re-enable. |
| **PromoBanner**           | Admin promo images per placement (TOP / BELOW_LIST / HOT_DEALS); `targetTag`.                                                                                                                                         |
| **Category**              | Catalog categories (slug / name / emoji icon).                                                                                                                                                                        |
| **Product**               | Catalog item; `price`/`oldPrice` cents, `stock`, `tags[]`, `specifications`, `createdById`.                                                                                                                           |
| **ProductImage**          | 0..N images per product; cascade-deleted.                                                                                                                                                                             |
| **Order**                 | Order header; friendly `number`, guest-capable, address snapshot, cents money, status enums.                                                                                                                          |
| **OrderStatusEvent**      | Append-only status timeline (first event = PENDING creation).                                                                                                                                                         |
| **OrderItem**             | Price + name snapshot lines (historical orders immutable).                                                                                                                                                            |
| **Review**                | Product reviews (1..5), `approved` flag, unique per (product, user).                                                                                                                                                  |
| **AuditLog**              | Append-only privileged-write log (actor / action / entity / metadata).                                                                                                                                                |

**Enums:** `Role`, `ProfileChangeField`, `ProfileChangeStatus`, `BannerPlacement`, `OrderStatus`
(PENDING/PAID/SHIPPED/DELIVERED/CANCELLED), `PaymentStatus` (UNPAID/PAID/REFUNDED/FAILED),
`PaymentMethod` (COD/PAYPAL/AMAZON/BKASH/NAGAD).

**Two data sources don't confuse them:**

- **`lib/products-db.js`** the live DB reads for customer pages (`listProducts`, `getProductBySlug`,
  `listFeatured`, `listBestSellers`, `queryProducts`, `listCategories`, `listProductsByTag`). Source of truth.
- **`lib/data.js`** the _static_ starter catalogue, now used **only** by `prisma/seed.js`. Do not wire
  customer pages back to it.

---

## 17. Configuration & environment variables

| Variable                                        | Purpose                                                         |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`                                  | MongoDB connection string (must point at a **replica set**).    |
| `NEXTAUTH_SECRET`                               | Session/JWT signing secret.                                     |
| `NEXTAUTH_URL`                                  | Canonical app URL.                                              |
| `AUTH_TRUST_HOST`                               | Trust the reverse proxy (deployment).                           |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`     | Enable Google login (blank = hidden).                           |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | Enable Facebook login (blank = hidden).                         |
| `UPLOAD_DIR`                                    | Product-image upload dir (default `./public/uploads/products`). |
| `UPLOAD_URL_PREFIX`                             | Public URL prefix for uploads (default `/uploads/products`).    |

Other config files:

- **`next.config.mjs`** `images.minimumCacheTTL: 0` (so overwriting a same-named `/public` image shows
  fresh on reload retune for production); `allowedDevOrigins` for LAN dev.
- **`postcss.config.mjs`** the single `@tailwindcss/postcss` plugin (Tailwind v4).
- **`eslint.config.mjs`** flat config extending `eslint-config-next/core-web-vitals`.
- **`jsconfig.json`** path alias `@/* → ./*`.

---

## 18. Internationalization & theming

- **i18n** (`lib/i18n/`) custom, **cookie-based**, currently **English-only** (Bangla was removed;
  plumbing kept). `getT()` serves server components; `useT()` serves client components. Strings live in
  `locales/en.json`. Lookup order: requested locale → English → raw key (never blank); supports
  `{placeholder}` interpolation. Cookie: `ecobazar-lang`.
- **Theme** (`lib/theme/`) **cookie-based dark mode** with **no flash**: the server reads the
  `ecobazar-theme` cookie and sets `<html class="dark">` before hydration. `ThemeProvider` toggles the
  class + cookie with no reload. Dark mode is class-based; `globals.css` remaps common surface utilities
  (e.g. `.dark .bg-white`).
- Provider nesting (root layout): **Theme → Language → Currency → Cart**.

---

## 19. Testing

- **Playwright** end-to-end tests live in `e2e/` (auth, cart, checkout, storefront, banners).
- Run: `npm run test:e2e` (headless), `npm run test:e2e:ui` (interactive), `npm run test:e2e:report`.
- **There is no unit-test runner** validation logic is exercised through e2e + manual QA.
- Manual QA aids: the login page's dev quick-fill buttons and the four seeded accounts.

---

## 20. Conventions & contribution rules

These are the load-bearing rules to follow when changing the code:

1. **`.js` = server, `.jsx` = client.** Keep `"use client"` / `"use server"` directives correct.
2. **Validate with Zod** before any DB write.
3. **Enforce roles at every layer** don't rely on middleware alone; re-check in server actions/APIs.
4. **Preserve the moderator ownership rule** (`createdById === user.id` for edit) when touching product
   mutations.
5. **Append an `AuditLog` row** on every privileged write (actorId / action / entity / entityId / metadata).
6. **Keep the stock guard** (`updateMany` with `stock: { gte: qty }`, `count === 0` → rollback).
7. **Never trust client money** recompute from the DB at checkout.
8. **Keep the coupon tables in sync** (CartContext + order-actions) ideally consolidate them.
9. **Money stays in integer cents** in the DB; convert only at the boundary via `lib/money.js`.
10. **Apply schema changes with `db:push`** (not `db:migrate`), then re-seed if needed.

---

## 21. Known limitations & TODOs

- Email verification is **not** enforced.
- Coupon definitions are duplicated and unlimited-use (no redemption tracking).
- Rate limiting is single-instance/in-memory.
- **Review moderation** customer-submitted reviews are **auto-approved** and immediately affect
  `Product.rating`. `Review.approved` is in the schema but there is no admin approve/reject UI.
- **Returns are recorded as CANCELLED** with a `"Return requested by customer"` note on the
  timeline event no distinct `RETURNED` status, no automated refund. Admin distinguishes "customer
  return" from "staff cancel" via the note.
- bcrypt cost differs between flows (10 vs 12).
- Cart-merge-on-login summing is a design choice; there is no per-line "keep max vs sum" toggle.
- No unit test runner; only e2e. **Several e2e specs still reference the old seed's slugs
  (`green-apple`, `eggplant`, `green-capsicum`) and old banner slugs (`top-deals`, `summer-sale`)**  
  they fail with "Seed product 'green-apple' missing" until updated to the current slugs
  (`deshi-apel`, `begun`, `misti-kumra`, `premium-selection`, `seasonal-picks`).
- Email delivery is console-only until a real transport is wired.
- **Guest orders that were placed BEFORE this feature landed** are not linked retroactively only
  future signups trigger the sweep. If needed, run the same `claimGuestOrdersForUser` from a
  one-off script for existing accounts.

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
Money is stored as **integer poisha** (1/100 of a Taka), so there's no float drift; the boundary
converter in `lib/money.js` turns it into Taka for display.

**Q: How does multi-currency work?**
It doesn't the store is **BDT-only**. All prices are stored, computed, and shown in Taka (৳).
The multi-currency plumbing (rates, `StoreConfig`, `CurrencyProvider`) is dormant, not deleted  
one file (`lib/store-config.js`) would flip it back on. See [§11](#11-money--pricing).

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
See [§14](#14-security--known-issues--how-to-find-them) it lists the known gaps and a 10-point audit
checklist (including `/security-review`).

**Q: Is email verification required?**
No it's issued at signup but **not enforced** at login.

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

- **App Router** Next.js routing where folders under `app/` are routes; `page.js` renders a route.
- **Server component / Server action** code that runs on the server; actions (`"use server"`) mutate
  data and are called from the client without a manual API.
- **Middleware** edge code that runs before a request reaches a route (here: auth gating).
- **JWT session** session state carried in a signed token, not a DB row.
- **Replica set** a MongoDB cluster mode that supports multi-document transactions.
- **Minor units / cents** the smallest currency unit (e.g. 1499 = $14.99) used for exact money math.
- **Audit log** an append-only record of privileged writes for accountability.
- **RBAC** role-based access control (CUSTOMER / MODERATOR / ADMIN here).
- **Anti-enumeration** not revealing whether an account exists (e.g. password reset always succeeds).

---

_Generated from a full read of the codebase on the `feature/auth-hardening` branch. When code changes,
update the affected section treat this file as living documentation._

---

## 24. Deployment VPS + GitHub Actions auto-deploy

The live site runs on a **1 GB / 1 CPU / 9.8 GB OpenVZ VPS (Ubuntu 24.04)** at
`https://eco.shanto.dev/` with a Let's Encrypt cert, behind nginx, with the Next.js app running
under PM2 as a non-root `ecobazar` user, and MongoDB 8.0 as a **local single-node replica set** on
`127.0.0.1:27017` (no auth localhost-only). See the runbook below.

### 24.1 First-time VPS bring-up (already done)

Server has:

- Node.js 22 LTS + PM2 (systemd unit `pm2-ecobazar` for auto-boot).
- MongoDB 8.0 with `bindIp: 127.0.0.1`, `replSetName: rs0`, WiredTiger cache capped at 256 MB
  (`/etc/mongod.conf`). Initialised once with `rs.initiate({_id:"rs0", members:[{_id:0, host:"localhost:27017"}]})`.
- nginx 1.24 as a reverse proxy on 80/443 → `127.0.0.1:3000`. Config at
  `/etc/nginx/sites-available/ecobazar` serves `/_next/static/*`, `/uploads/*`, `/favicon.ico`
  straight from disk. `client_max_body_size 12M`. gzip on.
- Let's Encrypt cert via certbot (`certbot --nginx -d eco.shanto.dev`). Auto-renewed by the
  `certbot.timer` systemd unit twice daily.
- `ufw` firewall allow 22 / 80 / 443, deny everything else inbound.
- Non-root `ecobazar` user; repo at `/home/ecobazar/app`. `.env` at `/home/ecobazar/app/.env`
  (chmod 600, owned by ecobazar) with production values **never rsync'd over**.
- Maintenance-page nginx snippet at `/etc/nginx/snippets/ecobazar-maintenance.conf` on 502/503/504
  from the upstream, nginx serves a friendly "we'll be right back" page instead. Silently
  disappears once PM2 answers again.

### 24.2 Auto-deploy on push to `main`

The workflow at `.github/workflows/deploy.yml` runs on every push to `main` (and on manual
`workflow_dispatch`):

1. `ubuntu-24.04` runner checks out `main`.
2. `npm ci --legacy-peer-deps` full deps (needed for `prisma generate` at postinstall, which
   downloads both the `native` and `debian-openssl-3.0.x` Prisma query engines per the
   `binaryTargets` in `prisma/schema.prisma`).
3. `npm run build` uses runner's 7 GB RAM, no VPS OOM risk. Build-time env has dummy
   `DATABASE_URL` + `NEXTAUTH_SECRET` (real values live only in the VPS's `.env`).
4. `npm prune --omit=dev` strip test/lint/typescript.
5. Rsync `.next/` + `node_modules/` + `public/` + source tree to the VPS as the `ecobazar` user.
   The runner's Linux `node_modules/.bin/next` symlink survives the transfer, unlike a
   Windows-side install which produces a bash-wrapper shim that `next start` rejects.
6. `pm2 restart ecobazar --update-env` (or first-time start with `--max-memory-restart 500M` so
   a runaway worker triggers a controlled restart instead of an OOM-lockup).
7. Smoke test: curl `https://eco.shanto.dev/` and expect 200 within 25 s job fails red if not.

**Required repo secrets** (Settings → Secrets and variables → Actions):

| Name                 | Value                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| `DEPLOY_SSH_KEY`     | Private half of an ed25519 keypair whose public half is in `/home/ecobazar/.ssh/authorized_keys` |
| `DEPLOY_KNOWN_HOSTS` | Output of `ssh-keyscan -t ed25519 eco.shanto.dev` (one line)                                     |
| `DEPLOY_HOST`        | `eco.shanto.dev`                                                                                 |
| `DEPLOY_USER`        | `ecobazar`                                                                                       |

### 24.3 Manual deploy from a laptop (if Actions is down)

```bash
ssh root@eco.shanto.dev 'sudo -u ecobazar -H bash -c "cd /home/ecobazar/app && git pull --ff-only && npm ci --no-audit --no-fund && NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=\"--max-old-space-size=768\" npm run build && pm2 restart ecobazar --update-env"'
```

**Don't** run `npm ci` or `next build` on the VPS without stopping mongod first the 1 GB
OpenVZ container's `privvmpages` limit will OOM the box. That's what the GH Actions runner
sidesteps by building off-box. Emergency-only.

### 24.4 Common runbook commands

```bash
# App logs
sudo -u ecobazar pm2 logs ecobazar --lines 100

# Reload nginx after editing /etc/nginx/sites-available/ecobazar
nginx -t && systemctl reload nginx

# Mongo shell (localhost, no auth)
mongosh --host 127.0.0.1:27017

# Renewal dry-run
certbot renew --dry-run

# Reseed prod DB (uses env-var admin)
sudo -u ecobazar -H bash -c 'cd /home/ecobazar/app && \
  SEED_ADMIN_EMAIL=you@example.com \
  SEED_ADMIN_PASSWORD='\''<pass>'\'' \
  SEED_WIPE_EXISTING=true \
  npm run db:seed:prod'
```

### 24.5 Known constraints on this specific box

- **OpenVZ container** swap is not permitted (`swapon` returns "Operation not permitted").
  The 1 GB RAM is a hard ceiling; PM2's `--max-memory-restart 500M` and MongoDB's `cacheSizeGB:
0.25` guardrails exist because of it.
- **`privvmpages` limit** blocks `fork` under memory pressure that's why npm ci on-VPS OOMs
  even with visible free RAM.
- **`mongod` runs on localhost only** nothing external can reach it. No DB auth required.
  If you ever expose it (`bindIp: 0.0.0.0` + firewall), enable keyfile auth first.
