// lib/auth.js
// Full Node-runtime NextAuth v5 (Auth.js) config. It extends the edge-safe
// `authConfig` from ../auth.config with everything that needs Node APIs:
//   • PrismaAdapter (DB)
//   • the bcrypt-backed Credentials provider (always enabled)
//   • a `jwt` callback that can read the DB
//   • the createUser event
//
// Split rationale: middleware.js runs on the Edge runtime and imports
// ../auth.config directly, so Prisma/bcrypt never enter the middleware bundle.
// The app (server components) and the /api/auth handlers run on Node and use
// this file.
//
// OAuth providers (Google/Facebook) are defined in auth.config.js and gated by
// their *_CLIENT_ID/SECRET env vars. hasGoogle/hasFacebook are re-exported here
// so existing imports (e.g. app/login/page.jsx) keep working.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig, hasGoogle, hasFacebook } from "../auth.config";

export { hasGoogle, hasFacebook };

// How long a role baked into the JWT is trusted before we re-check it against
// the DB. Keeps a demoted/promoted user's privileges from going stale for an
// entire token lifetime. A force-refresh (session.update()) bypasses this.
const ROLE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  adapter: PrismaAdapter(prisma),

  providers: [
    Credentials({
      name: "Username & password",
      credentials: {
        username: { label: "Username or email", type: "text" },
        password: { label: "Password",          type: "password" },
      },
      async authorize(creds) {
        if (!creds?.username || !creds?.password) return null;
        const identifier = String(creds.username).trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: identifier } });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(String(creds.password), user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),
    // OAuth providers (may be empty when no OAuth env vars are set).
    ...authConfig.providers,
  ],

  callbacks: {
    ...authConfig.callbacks,
    // Node-only override of the edge-safe `jwt`. On top of stamping role at
    // sign-in, it keeps role fresh against the DB:
    //   • sign-in (user present)     → stamp role + userId + roleSyncedAt
    //   • session.update() triggered → force a DB re-check (used after an admin
    //     changes a role in /dashboard/users)
    //   • token missing role, or role older than ROLE_TTL_MS → re-check from DB
    // Middleware still uses the pure edge callback (read-only), so this DB
    // access never runs on the Edge runtime.
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role         = user.role || "CUSTOMER";
        token.userId       = user.id;
        token.roleSyncedAt = Date.now();
        return token;
      }

      if (!token.userId) return token;

      const stale = !token.roleSyncedAt || Date.now() - token.roleSyncedAt > ROLE_TTL_MS;
      if (trigger === "update" || !token.role || stale) {
        const u = await prisma.user.findUnique({
          where:  { id: token.userId },
          select: { role: true },
        });
        token.role         = u?.role || "CUSTOMER";
        token.roleSyncedAt = Date.now();
      }
      return token;
    },
  },

  events: {
    // First-ever OAuth sign-in creates the User row via the adapter. Promote
    // the very first user in the system to ADMIN so a fresh install has at
    // least one privileged account.
    async createUser({ user }) {
      const userCount = await prisma.user.count();
      if (userCount <= 1) {
        await prisma.user.update({
          where: { id: user.id },
          data:  { role: "ADMIN" },
        });
      }
    },
  },
});
