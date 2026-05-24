// lib/prisma.js
// Singleton PrismaClient. In dev Next.js hot-reloads the module, which would
// create a new client (and a new pool) on every reload — so we cache it on
// globalThis instead. In production it's a normal module-level singleton.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma;
