// middleware.js
// Runs on the edge for every request. Two jobs:
//
//   1. Hostname routing.
//      If the request comes in on admin.ecobazar.com.bd, rewrite the URL so
//      that "/" maps to "/admin", "/products" maps to "/admin/products", etc.
//      The user sees the bare path; Next.js renders the admin pages.
//
//   2. Role protection.
//      Any /admin/* route requires the user to be at least MODERATOR.
//      /admin/users and the audit log require ADMIN.
//      Anonymous users are bounced to /admin/login.
//
// Auth.js exposes its own `auth` middleware function which we wrap; that
// makes session info available on req.auth without an extra DB hit.

import { NextResponse } from "next/server";
import { auth } from "./auth";

const ADMIN_HOST = process.env.ADMIN_HOST || "admin.ecobazar.com.bd";

// Routes inside /admin that need full ADMIN role (not just moderator).
const ADMIN_ONLY = [/^\/admin\/users/, /^\/admin\/audit/, /^\/admin\/settings/];

export default auth((req) => {
  const url   = req.nextUrl;
  const host  = req.headers.get("host") || "";
  const isAdminHost =
    host === ADMIN_HOST ||
    host === `www.${ADMIN_HOST}` ||
    // Local dev convenience — let `admin.localhost:3000` work.
    host.startsWith("admin.localhost");

  // ---- 1. Subdomain rewriting -----------------------------------------------
  // On admin.* host, any non-/admin path gets rewritten to /admin/<path>.
  // Login page lives at /admin/login. API routes pass through untouched.
  if (isAdminHost) {
    const p = url.pathname;
    if (!p.startsWith("/admin") && !p.startsWith("/api") && !p.startsWith("/_next")) {
      const rewritten = url.clone();
      rewritten.pathname = `/admin${p === "/" ? "" : p}`;
      return NextResponse.rewrite(rewritten);
    }
  } else {
    // On the customer host, hide /admin/* behind a 404.
    if (url.pathname.startsWith("/admin")) {
      const notFound = url.clone();
      notFound.pathname = "/not-found-fallback";
      return NextResponse.rewrite(notFound);
    }
  }

  // ---- 2. Role enforcement on /admin/* ---------------------------------------
  if (url.pathname.startsWith("/admin")) {
    const session = req.auth;
    const isLoginPage = url.pathname === "/admin/login";

    // Not logged in → send to /admin/login (except if already there).
    if (!session && !isLoginPage) {
      const login = url.clone();
      login.pathname = "/admin/login";
      login.searchParams.set("next", url.pathname);
      return NextResponse.redirect(login);
    }

    // Logged in but no admin/moderator role → 403.
    if (session && !isLoginPage) {
      const role = session.user?.role;
      if (role !== "ADMIN" && role !== "MODERATOR") {
        const forbid = url.clone();
        forbid.pathname = "/403";
        return NextResponse.rewrite(forbid);
      }
      if (ADMIN_ONLY.some((r) => r.test(url.pathname)) && role !== "ADMIN") {
        const forbid = url.clone();
        forbid.pathname = "/403";
        return NextResponse.rewrite(forbid);
      }
    }
  }

  return NextResponse.next();
});

// Run middleware on all routes except Next internals & static files.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|uploads).*)"],
};
