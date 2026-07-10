# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js 16 (App Router) + React 19, Tailwind CSS v4, Prisma + **MySQL**, NextAuth v5 (Auth.js). E-commerce store for organic groceries, with a role-based `/dashboard` living on the same domain as the storefront.

## Commands

```bash
npm run dev          # next dev on 0.0.0.0:3000 (hostname is pinned for LAN/dev-origin access)
npm run build        # runs `prisma generate` first, then `next build`
npm start            # serve the production build
npm run lint         # eslint (flat config, eslint-config-next)

npm run db:push      # prisma db push — sync schema, no migration history
npm run db:migrate   # prisma migrate dev — versioned migration
npm run db:studio    # Prisma Studio
npm run db:seed      # node prisma/seed.js — seeds 3 test users + 10 products
```

There is **no test runner** configured. `postinstall` runs `prisma generate`, so the Prisma client is regenerated on every `npm install`.

Seeded logins (sign in at `/login` with the bare username as both fields): `admin`/`admin` (ADMIN), `mod`/`mod` (MODERATOR), `customer`/`customer` (CUSTOMER). The login form lowercases the identifier and looks it up against `User.email`, so usernames *are* the email column.

## Authorization model (three enforcement layers)

Access control is deliberately layered — do not rely on any single layer:

1. **`middleware.js`** — only matches `/dashboard/:path*`. It checks *signed-in or not* and bounces anonymous users to `/unauthorized?next=...`. It does **not** do per-role checks.
2. **Server components / pages** — call `requireRole(...)` / `requireAuth(...)` from `lib/auth-helpers.js` to enforce the actual role per route (e.g. `/dashboard/users` is ADMIN-only, `/dashboard/products` is ADMIN+MODERATOR).
3. **Server actions & API routes** — re-check the role again (defence in depth) even though the route is already protected. See `app/dashboard/products/_actions.js` and `app/api/upload/route.js`.

`session.user` carries `id` and `role`, threaded through the JWT (`lib/auth.js` callbacks) so role checks never hit the DB on a normal request. Session strategy is `jwt`.

**Moderator ownership rule:** MODERATORs may create products but may only edit/delete products where `Product.createdById === user.id`; ADMIN can edit/delete any. This is enforced inside the server actions, not the schema — preserve it when touching product mutations.

**Every privileged write must append an `AuditLog` row** (`actorId`, `action` like `"product.update"`, `entity`, `entityId`, `metadata`). Follow the existing pattern in `_actions.js` when adding new mutating actions.

## Auth provider gating

`lib/auth.js` always registers the Credentials provider. Google/Facebook are registered **only** when their `*_CLIENT_ID` + `*_CLIENT_SECRET` env vars are non-empty (`hasGoogle`/`hasFacebook`). Empty envs → provider not mounted, no warnings, and the login page hides the corresponding button. The app boots clean with no OAuth config. The `createUser` event promotes the very first user in the system to ADMIN.

## Data sources — two of them, don't confuse them

- **`lib/products-db.js`** — DB-backed Prisma reads for customer pages (`listProducts`, `getProductBySlug`, `listFeatured`). This is the source of truth. It `shape()`s rows into the plain object the React components expect (Prisma `Decimal` → JS `number`, images → `{type, src, label}`).
- **`lib/data.js`** — the *static* starter catalogue. It is now used **only by `prisma/seed.js`** as seed input. Do not wire customer pages back to it.

## Orders & inventory

`lib/order-actions.js` `placeOrderAction` is the critical path. It runs inside a single `prisma.$transaction`:
- Prices/names are recomputed **from the DB**, never trusted from the client cart (anti-tampering).
- Stock is decremented with a guarded `updateMany({ where: { id, stock: { gte: qty } } })`; `count === 0` means a race lost the stock and the whole transaction rolls back. Keep this guard when editing.
- Coupon table is duplicated in three places that must stay in sync: `CartContext.COUPONS`, `order-actions` `COUPONS`, and any UI. Guest checkout is allowed (`userId` may be null).

## Cart / wishlist state

`lib/CartContext.jsx` is a client-only Context + `useReducer` (no external state lib). Cart, wishlist, and coupon persist to `localStorage` under key `ecobazar-cart-v1`. `useCart()` also exposes the toast system. There is no server-side cart; the cart is materialized into an order only at checkout. (Cart-merge-on-login is a listed TODO.)

## MySQL specifics (important gotchas)

- Provider is **`mysql`** in `prisma/schema.prisma`. Long text columns carry `@db.Text` to escape MySQL's default `VARCHAR(191)` ceiling (descriptions, addresses, OAuth tokens, image URLs, review bodies, notes, audit metadata).
- The default `utf8mb4_unicode_ci` collation is already case-insensitive, so **never** add Prisma's `mode: "insensitive"` to `contains` queries — it's PostgreSQL-only and throws on MySQL. `listProducts` search relies on this.

## Image uploads

`app/api/upload/route.js` (ADMIN/MODERATOR only) writes to `./public/uploads/products` (override via `UPLOAD_DIR` / `UPLOAD_URL_PREFIX` env) with a `Date.now()-<sha1>.<ext>` filename and returns `{ url }`. `next.config.mjs` sets `images.minimumCacheTTL: 0` so overwriting a same-named file in `/public/images` shows the new one on reload — retune for production.

## Conventions

- File extensions signal component type: server components/pages are `.js`, client components are `.jsx`. `"use client"` and `"use server"` directives are load-bearing.
- `auth.js` (root) and `middleware.js` are thin; the real NextAuth config is `lib/auth.js`.
- Input validation uses **Zod** in server actions before any DB write.
