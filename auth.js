// auth.js
// Central NextAuth v5 (Auth.js) configuration. Exported `auth` is the
// canonical server-side way to read the session; `signIn` / `signOut` are
// re-exported for use in server components and server actions.
//
// Providers:
//   • Google      — public OAuth (free, ~10 min setup in Google Cloud Console)
//   • Facebook    — public OAuth (Meta Developer console)
//   • Credentials — email + password, hashed with bcrypt
//
// Roles flow:
//   Every user has `user.role` in the DB. We expose it on the session via
//   the `session` callback so server components and middleware can check
//   it without an extra query.

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  // JWT sessions let us put `role` into the token and read it cheaply in
  // middleware without hitting the DB on every request.
  session: { strategy: "jwt" },

  pages: {
    signIn: "/signin",
    error:  "/signin",
  },

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Email & password",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: String(creds.email).toLowerCase() },
        });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(String(creds.password), user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),
  ],

  callbacks: {
    // Carry the role through token → session so client code can check it.
    async jwt({ token, user }) {
      if (user) {
        token.role   = user.role || "CUSTOMER";
        token.userId = user.id;
      } else if (token.userId && !token.role) {
        // First request after sign-in via OAuth — fetch role from DB.
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
    // First-ever sign-in via OAuth creates the User row through the adapter.
    // We make sure it gets a default role; the FIRST user is promoted to
    // ADMIN automatically so you have a way to log into the admin panel
    // before any other users exist.
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
