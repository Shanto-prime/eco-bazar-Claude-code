// lib/prisma.js
// Singleton PrismaClient. In dev Next.js hot-reloads the module, which would
// create a new client (and a new pool) on every reload — so we cache it on
// globalThis instead. In production it's a normal module-level singleton.

import { PrismaClient } from "@prisma/client";

// Fail loudly, and specifically, when DATABASE_URL is missing or malformed.
//
// Without this a misconfigured deployment surfaces as a wall of Prisma internals
// ("Server selection timeout", "empty database name not allowed") on whichever
// page happened to query first, which says nothing about the actual cause. The
// two mistakes that actually happen:
//   • the variable was never added to the hosting environment at all
//   • the Atlas string was pasted without the /<database> segment, because the
//     "Connect" dialog gives you `…mongodb.net/?retryWrites=true`
function assertDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set.\n" +
      "  • Local:  put it in .env (the Prisma CLI reads .env, not .env.local)\n" +
      "  • Vercel: Project → Settings → Environment Variables → add DATABASE_URL\n" +
      "            for Production, Preview and Development, then redeploy.",
    );
  }

  if (!/^mongodb(\+srv)?:\/\//.test(url)) {
    throw new Error(`DATABASE_URL must start with mongodb:// or mongodb+srv:// (got "${url.slice(0, 12)}…").`);
  }

  // A missing database name is accepted by the driver and then fails on every
  // query with "empty database name not allowed" — catch it here instead.
  try {
    const dbName = new URL(url).pathname.replace(/^\//, "");
    if (!dbName) {
      throw new Error(
        "DATABASE_URL has no database name.\n" +
        "  Add it before the '?':  …mongodb.net/ecobazar?retryWrites=true\n" +
        "  Atlas's Connect dialog omits it, which makes every query fail with\n" +
        '  "AtlasError: empty database name not allowed".',
      );
    }
  } catch (err) {
    // Re-throw our own message; swallow only URL-parsing noise (e.g. a password
    // containing characters that need percent-encoding).
    if (err instanceof Error && err.message.startsWith("DATABASE_URL")) throw err;
    throw new Error(
      "DATABASE_URL could not be parsed. If the password contains @ : / ? # [ ] or %, " +
      "percent-encode it (@ becomes %40).",
    );
  }
}

assertDatabaseUrl();

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma;
