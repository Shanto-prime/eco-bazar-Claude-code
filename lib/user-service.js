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
// Note: under two *simultaneous* first-ever signups, MySQL's default isolation
// can let both transactions see count <= 1 and both become ADMIN. That is an
// acceptable bootstrap-only edge case (worst case: two admins on a brand-new
// install); it is not a steady-state concern.
export async function promoteIfFirstUser(userId) {
  return prisma.$transaction(async (tx) => {
    const count = await tx.user.count();
    if (count <= 1) {
      await tx.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
      return "ADMIN";
    }
    return null;
  });
}
