// lib/auth-helpers.js
// Server-side helpers for session and role checks. Use these inside server
// components and server actions.

import { redirect } from "next/navigation";
import { auth } from "./auth";

const ROLES = ["CUSTOMER", "MODERATOR", "ADMIN"];

// Returns the session user object (with id + role), or null when anonymous.
export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

// Throws (via redirect) to /unauthorized when no session.
// Returns the user on success.
export async function requireAuth(nextPath = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/unauthorized?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

// requireRole("ADMIN")           — exact match required
// requireRole(["ADMIN","MODERATOR"]) — any of these roles
//
// Anonymous → redirected to /unauthorized.
// Signed in with wrong role → also /unauthorized.
export async function requireRole(roleOrRoles, nextPath = "/dashboard") {
  const user = await requireAuth(nextPath);
  const allowed = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  for (const r of allowed) {
    if (!ROLES.includes(r)) throw new Error(`Unknown role in requireRole: ${r}`);
  }
  if (!allowed.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}

// Boolean helpers (don't redirect) for inline UI checks.
export const isAdmin     = (u) => u?.role === "ADMIN";
export const isModerator = (u) => u?.role === "MODERATOR";
export const isCustomer  = (u) => u?.role === "CUSTOMER";
