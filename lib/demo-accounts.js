// lib/demo-accounts.js
// Four seeded demo accounts (see prisma/seed.js DEV_USERS) are "look-only":
// they can browse, place orders, and view the dashboard, but every mutating
// server action returns a friendly "this is a demo account" error and does
// nothing. Newly-signed-up users, admins created by super-admin, and every
// other real user in the DB are NOT affected.
//
// Match is by email (which is present on session.user for every server-side
// caller). Emails must stay in sync with the seed. Adding another demo
// account = adding its email to DEMO_EMAILS.

export const DEMO_EMAILS = new Set([
  "test-admin@shanto.dev",
  "test-mod@dhanto.dev",
  "customer@shanto.dev",
  "customer2@shanto.dev",
]);

// Human-readable message shown in the UI. Also used verbatim by API routes.
export const DEMO_BLOCK_MESSAGE =
  "This is a demo account. Editing is disabled — sign up for your own account to try changes.";

export function isDemoAccount(user) {
  if (!user || typeof user.email !== "string") return false;
  return DEMO_EMAILS.has(user.email.toLowerCase());
}

// Return-shape guard for server actions that use `{ ok, error }`. Call it
// AFTER the auth check (`requireAuth` / `requireRole`), BEFORE any DB write:
//
//   const actor = await requireRole("ADMIN", "/dashboard/orders");
//   const blocked = assertNotDemo(actor);
//   if (blocked) return blocked;
//   // …proceed with the mutation
//
// Returns null when the caller is not a demo account.
export function assertNotDemo(user) {
  if (!isDemoAccount(user)) return null;
  return { ok: false, error: DEMO_BLOCK_MESSAGE };
}

// Throw-based variant for API routes / places that use HTTP exceptions
// rather than the `{ ok, error }` shape. Use inside a try/catch and map
// the error to a JSON 403 response.
//
//   try {
//     assertNotDemoOrThrow(user);
//   } catch (e) {
//     if (e.demo) return NextResponse.json({ error: e.message }, { status: 403 });
//     throw e;
//   }
export function assertNotDemoOrThrow(user) {
  if (!isDemoAccount(user)) return;
  const err = new Error(DEMO_BLOCK_MESSAGE);
  err.demo = true;
  err.status = 403;
  throw err;
}
