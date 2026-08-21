// lib/tokens.js
// Single-use, expiring tokens for email verification and password reset,
// stored in the existing NextAuth `VerificationToken` table. The `identifier`
// column is namespaced as `<purpose>:<email>` so the same table serves both
// flows without collisions.

import crypto from "crypto";
import { prisma } from "./prisma";

const TTL_MS = 60 * 60 * 1000; // 1 hour

// Base URL for links in emails (password reset, email verification).
//
// Resolution order matters on Vercel:
//   1. NEXTAUTH_URL        set it once you have a custom domain; always wins.
//   2. VERCEL_URL          injected automatically on every Vercel deployment,
//                          including preview builds, WITHOUT the scheme. Falling
//                          straight through to localhost meant a deployment with
//                          no NEXTAUTH_URL mailed people "http://localhost:3000/
//                          reset-password?token=…", which is unusable.
//   3. localhost           local development.
export function appBaseUrl() {
    const explicit = process.env.NEXTAUTH_URL?.trim();
    if (explicit) return explicit.replace(/\/+$/, "");

    const vercel = process.env.VERCEL_URL?.trim();
    if (vercel)
        return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

    return "http://localhost:3000";
}

// Issue a fresh token for (purpose, email). Any previous token for the same
// pair is invalidated first, so only the newest link works.
export async function issueToken(purpose, email) {
    const identifier = `${purpose}:${email}`;
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + TTL_MS);

    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({
        data: { identifier, token, expires },
    });
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
