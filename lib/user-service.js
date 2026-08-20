// lib/user-service.js
// Shared user helpers. The "first user in the system becomes ADMIN" rule lives
// here in ONE place, called by both the credentials signup route
// (app/api/auth/signup) and the OAuth createUser event (lib/auth.js) — instead
// of two divergent copies.

import { prisma } from "./prisma";

// Promotes `userId` to ADMIN iff they are the only user in the system. Runs the
// count + update in a single transaction, so a fresh install always ends up
// with exactly one privileged account. Returns "ADMIN" when promoted, else null.
//
// Note: two *simultaneous* first-ever signups can both see count <= 1 and both
// become ADMIN — MongoDB transactions are snapshot-isolated, and neither one
// observes the other's insert. That is an acceptable bootstrap-only edge case
// (worst case: two admins on a brand-new install); it is not a steady-state
// concern.
export async function promoteIfFirstUser(userId) {
  return prisma.$transaction(async (tx) => {
    const count = await tx.user.count();
    if (count <= 1) {
      // First user is the founding ADMIN AND the super admin (undeletable /
      // undemotable — see app/dashboard/users/_actions.js).
      await tx.user.update({ where: { id: userId }, data: { role: "ADMIN", isSuperAdmin: true } });
      return "ADMIN";
    }
    return null;
  });
}

// Guest orders (userId=null) placed with a matching email get bound to a
// newly-created account on sign-up. Called from both the credentials signup
// route and the OAuth createUser event, so a customer who checks out as a
// guest and later opens an account with the same address sees their prior
// order in the dashboard on first login. Case-insensitive so a mis-cased
// email at checkout doesn't strand the order.
//
// Returns the number of orders claimed (mostly for the audit log; the caller
// can log-and-forget). Never throws — if the update fails for any reason the
// account still gets created, orders just stay unlinked.
export async function claimGuestOrdersForUser(userId, email) {
  if (!userId || !email) return 0;
  try {
    const res = await prisma.order.updateMany({
      where: {
        userId: null,
        // Mongo `contains` with mode: insensitive would match "test@x.com" in
        // "guesttest@x.com" — we want an exact case-insensitive equal. Prisma
        // MongoDB supports mode:insensitive on `equals`.
        email:  { equals: email, mode: "insensitive" },
      },
      data: { userId },
    });
    return res.count;
  } catch {
    return 0;
  }
}
