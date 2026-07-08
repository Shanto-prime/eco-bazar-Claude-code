// lib/auth.js
// Central NextAuth v5 (Auth.js) configuration.
//
// Providers
//   • Credentials — username/email + password (bcrypt). Always enabled.
//                   This is the one we actually use right now.
//   • Google      — optional. Only registered when GOOGLE_CLIENT_ID and
//                   GOOGLE_CLIENT_SECRET are both set. Empty envs → button
//                   isn't rendered and no provider is mounted.
//   • Facebook    — same as Google, gated by FACEBOOK_CLIENT_ID/SECRET.
//
// The app boots clean with empty OAuth envs — no warnings, no crashes.
// Two helpers (hasGoogle/hasFacebook) are exported so the login page can
// conditionally render the buttons.
//
// Roles
//   Every user has `user.role` in the DB. We expose it on the session via
//   the JWT callback so middleware and server components can check it
//   without an extra query.

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const hasEnv = (k) => !!process.env[k] && process.env[k].trim().length > 0;

export const hasGoogle   = hasEnv("GOOGLE_CLIENT_ID")   && hasEnv("GOOGLE_CLIENT_SECRET");
export const hasFacebook = hasEnv("FACEBOOK_CLIENT_ID") && hasEnv("FACEBOOK_CLIENT_SECRET");

const providers = [
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
];

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
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  providers,

  callbacks: {
    // Carry id + role through the JWT and into the session.
    async jwt({ token, user }) {
      if (user) {
        token.role   = user.role || "CUSTOMER";
        token.userId = user.id;
      } else if (token.userId && !token.role) {
        // First request after OAuth sign-in — fetch role from DB.
        const u = await prisma.user.findUnique({ where: { id: token.userId }, select: { role: true } });
        token.role = u?.role || "CUSTOMER";
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

  events: {
    // First-ever OAuth sign-in creates the User row via the adapter.
    // Promote the very first user in the system to ADMIN so a fresh install
    // has at least one privileged account.
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
