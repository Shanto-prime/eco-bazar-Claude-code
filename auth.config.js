// auth.config.js
// Edge-safe NextAuth (Auth.js v5) config, shared between the Edge-runtime
// middleware and the full Node config in lib/auth.js.
//
// HARD RULE: this file MUST stay edge-safe — do NOT import Prisma, bcrypt, the
// PrismaAdapter, or anything else Node-only. Middleware bundles this module for
// the Edge runtime; Node-only concerns (adapter, Credentials.authorize, DB
// reads, events) live in lib/auth.js, which spreads this config.
//
// Only OAuth providers appear here. The Credentials provider is added in
// lib/auth.js because its authorize() needs bcrypt + Prisma.

import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";

const hasEnv = (k) => !!process.env[k] && process.env[k].trim().length > 0;

export const hasGoogle   = hasEnv("GOOGLE_CLIENT_ID")   && hasEnv("GOOGLE_CLIENT_SECRET");
export const hasFacebook = hasEnv("FACEBOOK_CLIENT_ID") && hasEnv("FACEBOOK_CLIENT_SECRET");

const providers = [];

if (hasGoogle) {
  providers.push(
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

if (hasFacebook) {
  providers.push(
    Facebook({
      clientId:     process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      // Facebook email is not reliably verified, so auto-linking by email is a
      // takeover risk — keep it off. (Google, which verifies email, stays on.)
      allowDangerousEmailAccountLinking: false,
    })
  );
}

export const authConfig = {
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  providers,

  callbacks: {
    // Edge-safe / pure. lib/auth.js overrides `jwt` with a version that can
    // also read the DB. Middleware only ever *reads* a token that the Node
    // config already minted (with role) at sign-in, so no DB access is needed
    // here.
    async jwt({ token, user }) {
      if (user) {
        token.role   = user.role || "CUSTOMER";
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.userId;
        session.user.role = token.role || "CUSTOMER";
      }
      return session;
    },
  },
};
