"use server";

// app/dashboard/users/_actions.js — ADMIN-only user mutations.
// Follows the same pattern as products/_actions.js: re-check role, Zod-validate,
// mutate + write an AuditLog row, revalidate.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";

const RoleSchema = z.object({
  userId: z.string().min(1),
  role:   z.enum(["CUSTOMER", "MODERATOR", "ADMIN"]),
});

// Change a user's role. Returns { ok } / { ok:false, error } so the client can
// surface a message and roll its optimistic <select> back.
export async function updateUserRoleAction(input) {
  const actor = await requireRole("ADMIN", "/dashboard/users");

  let data;
  try { data = RoleSchema.parse(input); }
  catch { return { ok: false, error: "Invalid input." }; }

  const target = await prisma.user.findUnique({
    where:  { id: data.userId },
    select: { id: true, role: true },
  });
  if (!target) return { ok: false, error: "User not found." };
  if (target.role === data.role) return { ok: true }; // no-op

  // Guard 1: an admin can't change their own role (avoids self-lockout and
  // keeps the "who can promote me back" story simple).
  if (target.id === actor.id) {
    return { ok: false, error: "You can't change your own role." };
  }

  // Guard 2: never demote the last remaining ADMIN.
  if (target.role === "ADMIN" && data.role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return { ok: false, error: "Can't demote the last remaining admin." };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: data.userId }, data: { role: data.role } });
    await tx.auditLog.create({
      data: {
        actorId:  actor.id,
        action:   "user.role.update",
        entity:   "User",
        entityId: data.userId,
        metadata: { from: target.role, to: data.role },
      },
    });
  });

  revalidatePath("/dashboard/users");
  return { ok: true };
}
