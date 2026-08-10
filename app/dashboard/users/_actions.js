"use server";

// app/dashboard/users/_actions.js — ADMIN-only user mutations.
// Follows the same pattern as products/_actions.js: re-check role, Zod-validate,
// mutate + write an AuditLog row, revalidate.
//
// Super admin rule: the founding account (User.isSuperAdmin) can never be
// demoted or deleted by anyone. Every other admin is fully manageable by any
// admin (create / downgrade / delete), which is what lets a team of admins
// self-manage without being able to remove the owner.

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { BCRYPT_COST } from "../../../lib/password";
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
    select: { id: true, role: true, isSuperAdmin: true },
  });
  if (!target) return { ok: false, error: "User not found." };
  if (target.role === data.role) return { ok: true }; // no-op

  // Guard 0: the super admin's role is locked. Nobody can demote the owner.
  if (target.isSuperAdmin && data.role !== "ADMIN") {
    return { ok: false, error: "The super admin's role can't be changed." };
  }

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

const CreateUserSchema = z.object({
  name:     z.string().min(1).max(120),
  email:    z.string().email().transform((s) => s.trim().toLowerCase()),
  username: z.string().regex(/^[a-z0-9_.-]+$/, "letters, digits, _ . - only").min(3).max(40)
              .transform((s) => s.toLowerCase())
              .optional().or(z.literal("").transform(() => undefined)),
  password: z.string().min(8).max(128),
  // Admins create staff accounts only. Customers self-register.
  role:     z.enum(["MODERATOR", "ADMIN"]),
});

// Create a brand-new staff account (ADMIN or MODERATOR). Admin-only. New admins
// are never super admins — that flag belongs to the founding account alone.
export async function createUserAction(input) {
  const actor = await requireRole("ADMIN", "/dashboard/users");

  let data;
  try { data = CreateUserSchema.parse(input); }
  catch (e) { return { ok: false, error: e?.errors?.[0]?.message || "Invalid input." }; }

  // Uniqueness (email always; username when supplied).
  const clash = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, ...(data.username ? [{ username: data.username }] : [])] },
    select: { email: true, username: true },
  });
  if (clash) {
    const which = clash.email === data.email ? "email" : "username";
    return { ok: false, error: `That ${which} is already in use.` };
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_COST);

  const created = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        name:         data.name,
        email:        data.email,
        username:     data.username ?? null,
        passwordHash,
        role:         data.role,
        isSuperAdmin: false,
      },
      select: { id: true },
    });
    await tx.auditLog.create({
      data: {
        actorId:  actor.id,
        action:   "user.create",
        entity:   "User",
        entityId: u.id,
        metadata: { email: data.email, role: data.role },
      },
    });
    return u;
  });

  revalidatePath("/dashboard/users");
  return { ok: true, id: created.id };
}

// Delete a user account. Admin-only. The super admin, your own account, and the
// last remaining admin are all protected. Products the user created are
// reassigned to the acting admin so the storefront isn't left with orphans; the
// user's other data cascades (cart, addresses, reviews, sessions) or is nulled
// (their orders become guest orders, their audit rows keep the action but lose
// the actor link).
export async function deleteUserAction(input) {
  const actor = await requireRole("ADMIN", "/dashboard/users");

  const userId = typeof input === "string" ? input : input?.userId;
  if (!userId || typeof userId !== "string") return { ok: false, error: "Invalid input." };

  const target = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, role: true, isSuperAdmin: true, email: true },
  });
  if (!target) return { ok: false, error: "User not found." };
  if (target.isSuperAdmin) return { ok: false, error: "The super admin can't be deleted." };
  if (target.id === actor.id) return { ok: false, error: "You can't delete your own account." };

  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) return { ok: false, error: "Can't delete the last remaining admin." };
  }

  await prisma.$transaction(async (tx) => {
    // Keep the catalogue intact: hand this user's products to the acting admin.
    await tx.product.updateMany({ where: { createdById: userId }, data: { createdById: actor.id } });
    await tx.auditLog.create({
      data: {
        actorId:  actor.id,
        action:   "user.delete",
        entity:   "User",
        entityId: userId,
        metadata: { email: target.email, role: target.role },
      },
    });
    await tx.user.delete({ where: { id: userId } });
  });

  revalidatePath("/dashboard/users");
  return { ok: true };
}
