// middleware.js
// Single job: protect /dashboard/*. If there's no session, bounce the user
// to /unauthorized. Per-role checks (admin-only vs moderator vs customer)
// happen inside the matching server components via requireRole() from
// lib/auth-helpers.js — middleware only knows "is signed in or not".
//
// Edge-safety: this middleware is built from the edge-safe ../auth.config
// (NOT lib/auth.js), so Prisma and bcrypt never enter the middleware bundle.
// The token it reads was minted by the Node config at sign-in.

import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const url = req.nextUrl;

  // `req.auth?.user` (not just `req.auth`): an idle-expired session still has a
  // session object but its `user` is nulled out, so it must count as anonymous.
  if (url.pathname.startsWith("/dashboard")) {
    if (!req.auth?.user) {
      const redirect = url.clone();
      redirect.pathname = "/unauthorized";
      redirect.search = `?next=${encodeURIComponent(url.pathname)}`;
      return NextResponse.redirect(redirect);
    }
  }

  // Wishlist is a signed-in-only page. Anonymous visitors are sent to /login
  // with a `next` param; LoginForm returns them here after a successful login.
  if (url.pathname.startsWith("/wishlist")) {
    if (!req.auth?.user) {
      const redirect = url.clone();
      redirect.pathname = "/login";
      redirect.search = `?next=${encodeURIComponent(url.pathname)}`;
      return NextResponse.redirect(redirect);
    }
  }

  return NextResponse.next();
});

// Run middleware on the protected paths only. Everything else is public.
export const config = {
  matcher: ["/dashboard/:path*", "/wishlist", "/wishlist/:path*"],
};
