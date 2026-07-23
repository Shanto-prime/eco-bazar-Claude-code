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
import { rateLimit, clientIp } from "./rate-limit";
import { promoteIfFirstUser } from "./user-service";
import { isIdleExpired } from "./session-policy";
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
      async authorize(creds, request) {
        if (!creds?.username || !creds?.password) return null;
        const identifier = String(creds.username).trim().toLowerCase();

        // Throttle brute-force: cap attempts per account (targeted) and per IP
        // (spray across accounts). Tripping returns null — same generic failure
        // the UI shows for a wrong password, and bcrypt.compare is skipped.
        const ip   = clientIp(request);
        const byId = rateLimit(`login:id:${identifier}`, { limit: 10, windowMs: 15 * 60 * 1000 });
        const byIp = rateLimit(`login:ip:${ip}`,         { limit: 30, windowMs: 15 * 60 * 1000 });
        if (!byId.ok || !byIp.ok) return null;

        // Accept either the username or the email as the login identifier.
        const user = await prisma.user.findFirst({
          where: { OR: [{ username: identifier }, { email: identifier }] },
        });
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
      const now = Date.now();
      if (user) {
        token.role           = user.role || "CUSTOMER";
        token.userId         = user.id;
        token.roleSyncedAt   = now;
        token.lastActivityAt = now;
        return token;
      }

      if (!token.userId) return token;

      // Auto-logout on inactivity (6h customers / 12h admin+mod). Checked before
      // the activity stamp is refreshed, using the role currently in the token.
      if (isIdleExpired(token, now)) {
        return { expired: true };
      }

      const stale = !token.roleSyncedAt || now - token.roleSyncedAt > ROLE_TTL_MS;
      if (trigger === "update" || !token.role || stale) {
        const u = await prisma.user.findUnique({
          where:  { id: token.userId },
          select: { role: true, name: true, email: true, image: true },
        });
        token.role         = u?.role || "CUSTOMER";
        token.roleSyncedAt = Date.now();

        // Name/email/avatar ride along on the same query, so /dashboard/settings
        // edits reach the top-bar greeting and avatar without a re-login. There
        // is no SessionProvider mounted, so the client cannot force an update();
        // this TTL-driven refresh is the only path. Guarded on `u` so a deleted
        // row leaves the existing token fields alone rather than blanking them.
        if (u) {
          token.name    = u.name;
          token.email   = u.email;
          token.picture = u.image;
        }
      }

      // Rolling activity stamp — the "last request" time the idle check reads.
      token.lastActivityAt = now;
      return token;
    },
  },

  events: {
    // First-ever OAuth sign-in creates the User row via the adapter. Promote
    // the very first user in the system to ADMIN (shared helper — same rule the
    // credentials signup route uses).
    async createUser({ user }) {
      await promoteIfFirstUser(user.id);
    },

    // Record the sign-in timestamp for every successful login (credentials +
    // OAuth). Surfaced to the user on /dashboard/settings. Best-effort: a write
    // failure must never block the login.
    async signIn({ user }) {
      if (!user?.id) return;
      try {
        await prisma.user.update({
          where: { id: user.id },
          data:  { lastLoginAt: new Date() },
        });
      } catch {
        // Non-fatal — the session is already established.
      }
    },
  },
});
