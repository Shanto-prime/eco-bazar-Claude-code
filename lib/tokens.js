// lib/tokens.js
// Single-use, expiring tokens for email verification and password reset,
// stored in the existing NextAuth `VerificationToken` table. The `identifier`
// column is namespaced as `<purpose>:<email>` so the same table serves both
// flows without collisions.

import crypto from "crypto";
import { prisma } from "./prisma";

const TTL_MS = 60 * 60 * 1000; // 1 hour

// Base URL for links in emails. NEXTAUTH_URL in prod; localhost fallback in dev.
export function appBaseUrl() {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
}

// Issue a fresh token for (purpose, email). Any previous token for the same
// pair is invalidated first, so only the newest link works.
export async function issueToken(purpose, email) {
  const identifier = `${purpose}:${email}`;
  const token   = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token, expires } });
  return token;
}

// Consume a token: validates purpose, deletes it (one-time use), then checks
// expiry. Returns { email } on success, or null when invalid/expired.
export async function consumeToken(purpose, token) {
  if (!token) return null;
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row) return null;

  const prefix = `${purpose}:`;
  if (!row.identifier.startsWith(prefix)) return null;

  // One-time use: remove before returning, regardless of expiry outcome.
  await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
  if (row.expires < new Date()) return null;

  return { email: row.identifier.slice(prefix.length) };
}
