# Ecobazar — Next.js App

Next.js 16 (App Router) + React 19 e-commerce store for organic groceries.
Tailwind CSS v4, Prisma + **MySQL**, NextAuth v5 (credentials + optional
Google/Facebook), role-based `/dashboard` on a single domain.

---

## Run it

```bash
cd "D:\claude\test e com project\ecobazar-next"
npm install

cp .env.example .env.local        # fill in DATABASE_URL + NEXTAUTH_SECRET

# MySQL — fresh schema. Delete prisma/migrations (if any) before running:
npx prisma migrate dev --name init-mysql

# Seed three test users + 10 starter products:
npx prisma db seed                # (or: npm run db:seed)

npm run dev                       # http://localhost:3000
```

### Test accounts

Sign in at `/login`. The login form accepts the bare username:

| Username   | Password   | Role      |
|------------|------------|-----------|
| `admin`    | `admin`    | ADMIN     |
| `mod`      | `mod`      | MODERATOR |
| `customer` | `customer` | CUSTOMER  |

When `NODE_ENV !== "production"` the login page renders a small banner
listing these accounts so you don't have to remember them.

---

## Route map

| URL                       | Access                              |
|---------------------------|-------------------------------------|
| `/`                       | public                              |
| `/shop`                   | public                              |
| `/shop/[slug]`            | public — product detail             |
| `/cart`                   | public                              |
| `/wishlist`               | public                              |
| `/checkout`               | public (guest checkout)             |
| `/contact`                | public                              |
| `/login`                  | public                              |
| `/register`               | public                              |
| `/unauthorized`           | public — shown when blocked         |
| `/dashboard`              | any authenticated user (role router) |
| `/dashboard/products`     | ADMIN + MODERATOR                   |
| `/dashboard/orders`       | any auth user (data scoped by role) |
| `/dashboard/reviews`      | ADMIN + MODERATOR                   |
| `/dashboard/users`        | ADMIN only                          |
| `/dashboard/audit-log`    | ADMIN only                          |

`middleware.js` redirects unauthenticated requests to `/dashboard/*` →
`/unauthorized?next=...`. Per-role checks happen server-side inside each
sub-page via `requireRole(...)` from `lib/auth-helpers.js`.

---

## Project layout

```
ecobazar-next/
├── app/
│   ├── layout.js               root chrome (TopBar/Header/Nav/Newsletter/Footer)
│   ├── page.js                 home
│   ├── shop/page.js            product listing
│   ├── shop/[slug]/page.js     product detail
│   ├── cart/page.js
│   ├── checkout/page.js
│   ├── wishlist/page.js
│   ├── contact/page.js
│   ├── login/                  credentials form + optional OAuth buttons
│   ├── register/
│   ├── unauthorized/           shown on auth bounce
│   ├── dashboard/              role-routed admin/mod/customer area
│   │   ├── layout.js
│   │   ├── page.jsx            branches on session.user.role
│   │   ├── _components/        AdminDashboard, ModeratorDashboard, CustomerDashboard, DashboardShell
│   │   ├── products/           ADMIN + MODERATOR
│   │   ├── orders/             all roles, scoped server-side
│   │   ├── reviews/            ADMIN + MODERATOR
│   │   ├── users/              ADMIN only
│   │   └── audit-log/          ADMIN only
│   └── api/
│       ├── auth/[...nextauth]
│       ├── auth/signup
│       └── upload              POST image upload (ADMIN + MODERATOR)
├── components/                 shared UI
├── lib/
│   ├── auth.js                 NextAuth v5 config + env-gated OAuth
│   ├── auth-helpers.js         getCurrentUser / requireAuth / requireRole
│   ├── prisma.js
│   ├── products-db.js
│   ├── order-actions.js        placeOrderAction (atomic inventory)
│   ├── CartContext.jsx
│   └── data.js                 static catalogue used by client filters
├── prisma/
│   ├── schema.prisma           MySQL provider
│   └── seed.js                 admin / mod / customer + 10 products
├── middleware.js               only protects /dashboard/*
└── auth.js                     thin re-export of lib/auth.js
```

---

## Database (MySQL)

`prisma/schema.prisma` uses `provider = "mysql"`. Long string columns carry
`@db.Text` so they don't hit the default VARCHAR(191) ceiling (descriptions,
addresses, OAuth tokens, image URLs, review bodies, notes).

The default MySQL collation `utf8mb4_unicode_ci` is already case-insensitive,
so `Prisma`'s PostgreSQL-only `mode: "insensitive"` is **not** used anywhere
in this codebase.

Local MySQL setup:

```bash
# Ubuntu / Debian:
sudo apt install mysql-server
sudo mysql <<'SQL'
CREATE USER 'ecobazar'@'localhost' IDENTIFIED BY 'change-this-password';
CREATE DATABASE ecobazar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON ecobazar.* TO 'ecobazar'@'localhost';
SQL
```

`DATABASE_URL="mysql://ecobazar:change-this-password@localhost:3306/ecobazar"`

---

## Auth — credentials + optional OAuth

`Credentials` is always on. `Google` and `Facebook` are conditionally
registered in `lib/auth.js` based on env vars:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

Empty values → provider isn't registered, button isn't rendered, no warnings.
To enable later, fill in the IDs/secrets and restart. The login page reads
`hasGoogle` / `hasFacebook` server-side and only renders the corresponding
button when the env vars are set.

The session uses the JWT strategy and includes `id` + `role` on
`session.user`, so middleware and server components can read the role
without a DB hit.

---

## What's still TODO

Marked with `// TODO:` comments in the code:

- Full customer order history (filters, detail view)
- Full admin order management (status edits, refunds, search)
- Full admin user management (role change, ban, password reset trigger)
- Review approve / reject server actions
- Password reset email flow
- Cart merge on login
- Real bKash / Nagad / SSLCOMMERZ payment integration (schema fields exist)

---

## Useful commands

```bash
npm run dev          # dev server with hot reload
npm run build        # production build
npm start            # run the production build

npm run db:push      # sync schema to DB (no migration history)
npm run db:migrate   # create + apply a versioned migration
npm run db:studio    # open Prisma Studio
npm run db:seed      # seed the three test users + 10 products
```
