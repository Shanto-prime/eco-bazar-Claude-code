# Ecobazar — Setup Guide

End-to-end checklist to get the project running locally and deployed to your
own domain. Read top to bottom on first setup; bookmark for reference later.

---

## 0. What you're getting

A Next.js 16 app with:

- **Customer site** at `ecobazar.com.bd` — shop, cart, checkout, orders, reviews.
- **Admin site** at `admin.ecobazar.com.bd` — login, product CRUD, image upload, dashboard, role-based access.
- **Database** — PostgreSQL via Prisma. Source of truth for products, users, orders, reviews, audit log.
- **Auth** — Google, Facebook, and email + password via Auth.js v5.
- **Roles** — `CUSTOMER`, `MODERATOR`, `ADMIN`. Moderator can add products; admin can do everything and sees who added what.
- **Atomic inventory** — placing an order locks rows and decrements stock in one DB transaction. No overselling.
- **Image upload** — `/api/upload` writes to `public/uploads/products/` with hashed filenames; protected by role.

---

## 1. Install Node, npm, PostgreSQL

You need:

- **Node 22+** (`node -v`)
- **npm 10+** (`npm -v`)
- **PostgreSQL 15+** running somewhere you can reach (local, VPS, Neon, Supabase)

If you're using your own server:

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Create the database and user
sudo -u postgres psql <<'SQL'
CREATE USER ecobazar WITH PASSWORD 'change-this-password';
CREATE DATABASE ecobazar OWNER ecobazar;
GRANT ALL PRIVILEGES ON DATABASE ecobazar TO ecobazar;
SQL
```

Your connection string will look like:
`postgresql://ecobazar:change-this-password@localhost:5432/ecobazar`

---

## 2. Install project dependencies

```bash
cd "D:\claude\test e com project\ecobazar-next"
npm install
```

This pulls in `@prisma/client`, `next-auth`, `bcryptjs`, `zod`, and the dev tools.

---

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in real values:

| Variable | What to put |
|---|---|
| `DATABASE_URL`         | Your full Postgres connection string (see §1) |
| `AUTH_SECRET`          | Random 32-byte base64. Generate with `openssl rand -base64 32` |
| `AUTH_URL`             | `http://localhost:3000` for dev, `https://ecobazar.com.bd` for production |
| `AUTH_GOOGLE_ID`/`_SECRET` | From Google Cloud Console (see §4) |
| `AUTH_FACEBOOK_ID`/`_SECRET` | From Facebook Developer Console (see §5) |
| `ADMIN_HOST` | `admin.ecobazar.com.bd` in production, `admin.localhost:3000` in dev |
| `PUBLIC_HOST` | `ecobazar.com.bd` in production |

You can skip Google/Facebook for the first run — email + password works without them.

---

## 4. Google OAuth setup (optional, ~10 min)

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create a new project if you don't have one ("Ecobazar").
3. **Configure OAuth consent screen** first. External type, fill app name + email. Add scope: `openid email profile`.
4. Click **Create credentials → OAuth client ID**. Application type: **Web application**.
5. Authorized redirect URIs — add every URL your site uses:

       http://localhost:3000/api/auth/callback/google
       https://ecobazar.com.bd/api/auth/callback/google
       https://admin.ecobazar.com.bd/api/auth/callback/google

   These URLs must match exactly. Off by a slash and login silently fails.
6. Copy the Client ID + Secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

---

## 5. Facebook Login setup (optional, ~15 min)

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps), create a new app, type "Consumer".
2. Add product "Facebook Login" → Settings.
3. Valid OAuth Redirect URIs — same as Google but `/callback/facebook`:

       http://localhost:3000/api/auth/callback/facebook
       https://ecobazar.com.bd/api/auth/callback/facebook
       https://admin.ecobazar.com.bd/api/auth/callback/facebook

4. App Domains — add `localhost`, `ecobazar.com.bd`, `admin.ecobazar.com.bd`.
5. Settings → Basic → copy App ID and App Secret into `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET`.
6. **Important**: For production you must submit your app for review by Facebook before non-developers can log in. Allow ~3 days.

---

## 6. Run the database migration

This creates all the tables defined in `prisma/schema.prisma`.

```bash
# For your first run on a fresh DB:
npm run db:push

# Or, if you want versioned migrations:
npm run db:migrate -- --name init
```

Then seed it with the 10 starter products + 2 demo users:

```bash
npm run db:seed
```

You should see output like:

       • Users  : admin@ecobazar.test (admin12345)  •  mod@ecobazar.test (mod12345)
       • 10 products seeded.

---

## 7. Run the dev server

```bash
npm run dev
```

Open:

- Customer site:  `http://localhost:3000`
- Admin panel:    `http://localhost:3000/admin`  (or `http://admin.localhost:3000` if your OS resolves `admin.localhost` — most modern setups do)

Sign in to the admin panel with `admin@ecobazar.test` / `admin12345`. The first user you create via Google/Facebook OAuth will also be promoted to ADMIN automatically (see `auth.js` events.createUser).

---

## 8. Local subdomain trick

To test the subdomain split locally without DNS:

**macOS / Linux** — edit `/etc/hosts`:

       127.0.0.1   admin.localhost

**Windows** — edit `C:\Windows\System32\drivers\etc\hosts` (as Administrator):

       127.0.0.1   admin.localhost

Now `http://admin.localhost:3000` serves the admin app, and `http://localhost:3000` serves the customer app — same process, different subdomain.

---

## 9. Production deployment

You picked self-hosted on cPanel, but as I flagged: most shared cPanel hosting won't run Next.js. Here are three realistic paths, easiest first.

### Option A: Tiny VPS (recommended)

Rent a small VPS (Hetzner CX22 ~€4/mo, Contabo VPS S ~$4.50/mo, DigitalOcean Basic $4/mo in Singapore).

```bash
# On the VPS:
sudo apt update
sudo apt install -y nodejs npm postgresql nginx certbot python3-certbot-nginx git
# (or use NodeSource for newer Node)

# Clone your repo
git clone https://github.com/your-username/ecobazar.git
cd ecobazar
npm install
cp .env.example .env.local        # fill in production values
npm run db:push
npm run db:seed
npm run build

# Use PM2 to keep Next.js running
sudo npm install -g pm2
pm2 start "npm start" --name ecobazar
pm2 save && pm2 startup
```

Nginx config (in front of Next.js on port 3000):

       server {
         listen 80;
         server_name ecobazar.com.bd admin.ecobazar.com.bd;
         location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
         }
       }

Then get free SSL certificates:

       sudo certbot --nginx -d ecobazar.com.bd -d admin.ecobazar.com.bd

DNS at your registrar:
- A record `ecobazar.com.bd` → VPS IP
- A record `admin.ecobazar.com.bd` → VPS IP

### Option B: Vercel (zero-cost path)

1. Push the repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. Add environment variables in Vercel project settings.
4. For the database use a Neon free tier (`https://neon.tech` — they integrate directly into Vercel).
5. In Vercel → Settings → Domains, add both `ecobazar.com.bd` and `admin.ecobazar.com.bd`. Vercel shows you DNS records to add at your registrar.

### Option C: Shared cPanel (only if it has Node.js)

If your cPanel includes "Setup Node.js App" (LiteSpeed / CloudLinux):

1. cPanel → Setup Node.js App → Create.
   - Node version: 22+
   - Application root: `ecobazar-next`
   - Application URL: `ecobazar.com.bd`
   - Application startup file: `node_modules/.bin/next` with args `start -p $PORT` (some panels handle this differently — check the docs).
2. Upload your repo (Git Version Control feature or SFTP).
3. cPanel → Environment Variables → paste the contents of `.env.local`.
4. Run NPM Install from cPanel.
5. **PostgreSQL** — if your host only has MySQL, change `provider = "postgresql"` to `provider = "mysql"` in `prisma/schema.prisma` and re-run `npx prisma db push`. Or rent a small DB from Neon and connect remotely.
6. **Subdomain** — cPanel → Subdomains → create `admin.ecobazar.com.bd` pointing to the same `ecobazar-next` directory.

Shared cPanel will be slow (the Node app sleeps between requests) and you'll be limited on memory. If revenue justifies it, move to Option A.

---

## 10. What's NOT in this scaffold yet

These are intentional gaps you can fill in follow-up sessions:

- **Customer order history page** — orders exist in DB, no `/account/orders` UI yet.
- **Admin orders dashboard** — sidebar link exists, page itself not built.
- **Admin user management** — same; CRUD on users not written.
- **Admin reviews moderation** — schema is there, UI is not.
- **Password reset email** — Auth.js supports it; needs an email provider (Resend free tier).
- **Cart merge on login** — guest cart in localStorage doesn't currently merge into a server-side cart.
- **Phone OTP login** — not added; needs a paid SMS provider.
- **Payment gateways** — bKash, Nagad, SSLCOMMERZ etc. The schema has fields, no integration code.

The architecture is in place for all of these; each is ~1 session of focused work.

---

## 11. Common gotchas

1. **OAuth redirect URI mismatch** — by far the most common login failure. The URL in Google/Facebook console must match the URL in your browser **exactly** including https vs http, trailing slash, subdomain.

2. **`AUTH_TRUST_HOST` missing** — if you're behind nginx or any reverse proxy, set `AUTH_TRUST_HOST="true"` in `.env`. Otherwise NextAuth refuses to read the forwarded headers.

3. **`PrismaClient is unable to be run in the browser`** — means a server-only file got imported into a client component. Re-check that any file importing from `lib/prisma.js` does NOT have `"use client"` at the top.

4. **Image uploads failing on deployment** — `/public/uploads/` must be writable by the Node process. On a VPS this usually works out of the box; on shared hosting check folder permissions (`chmod 755`).

5. **Database row already exists** during seed — the seed script uses `upsert` so it's safe to re-run, but if you renamed a slug between runs you'll have stale rows. Drop the table from Prisma Studio (`npm run db:studio`) and re-seed.

6. **Subdomain not routing in production** — make sure `ADMIN_HOST` env var matches exactly. Also check that DNS for both apex and admin.* points to the same server.

---

## 12. Useful commands

```bash
npm run dev          # start dev server with hot reload
npm run build        # production build
npm start            # run the production build

npm run db:push      # sync schema to DB (no migration history)
npm run db:migrate   # create + apply a versioned migration
npm run db:studio    # open Prisma Studio — visual DB browser
npm run db:seed      # populate the 10 starter products + demo users
```

---

That's everything you need to get from zero to a running production site. Take it step by step; the OAuth setup is the most fiddly part — the rest is mostly copy-paste-and-fill.
