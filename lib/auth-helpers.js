// lib/auth-helpers.js
// Small server-side helpers for role checks. Use these in server components
// and server actions; the bare `auth()` call returns the session.

import { auth } from "../auth";
import { redirect } from "next/navigation";

export const ROLE_RANK = { CUSTOMER: 0, MODERATOR: 1, ADMIN: 2 };

// Returns the user session or null. Server components / actions only.
export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

// Throws (via redirect) to /signin if the user isn't signed in. Returns the
// user if they are. Optionally requires a minimum role.
export async function requireUser({ role = "CUSTOMER", redirectTo } = {}) {
  const user = await getCurrentUser();
  if (!user) {
    const next = redirectTo || "/signin";
    redirect(next);
  }
  if (ROLE_RANK[user.role] < ROLE_RANK[role]) {
    // User is signed in but lacks the role — send them to the forbidden page.
    redirect("/403");
  }
  return user;
}

// Boolean helpers (don't redirect) for inline UI checks.
export const isAdmin     = (u) => u?.role === "ADMIN";
export const isModerator = (u) => u?.role === "MODERATOR" || u?.role === "ADMIN";
