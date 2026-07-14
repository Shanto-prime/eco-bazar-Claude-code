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
    // Node-only override of the edge-safe `jwt`: also fetches role from the DB
    // on the first request after an OAuth sign-in, when the adapter user hasn't
    // put a role on the token yet.
    async jwt({ token, user }) {
      if (user) {
        token.role   = user.role || "CUSTOMER";
        token.userId = user.id;
      } else if (token.userId && !token.role) {
        const u = await prisma.user.findUnique({ where: { id: token.userId }, select: { role: true } });
        token.role = u?.role || "CUSTOMER";
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
