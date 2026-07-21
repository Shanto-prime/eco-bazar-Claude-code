"use server";

// app/dashboard/profile-requests/_actions.js
// ADMIN + MODERATOR review of pending email/phone changes raised from
// /dashboard/settings. Both actions are privileged writes on somebody else's
// account, so both append an AuditLog row.
//
// Approving an EMAIL change deliberately does NOT mark the address verified —
// it clears User.emailVerified and mails a fresh verification link instead.
// Two independent gates: a reviewer confirms the change is legitimate, and the
// mailbox confirms the user actually controls it. Approving alone would let a
// typo'd address through and silently break password reset.

import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { applyContactChange, notifyContactChange } from "../../../lib/profile-changes";

const ok   = (message) => ({ ok: true, message });
const fail = (error)   => ({ ok: false, error });

export async function approveChangeAction(requestId, note) {
  const reviewer = await requireRole(["ADMIN", "MODERATOR"], "/dashboard/profile-requests");

  const req = await prisma.profileChangeRequest.findUnique({
    where:   { id: String(requestId) },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!req)                    return fail("Request not found.");
  if (req.status !== "PENDING") return fail("This request has already been reviewed.");

  // Re-check uniqueness at approval time, not just at request time: another
  // account may have claimed the address while this sat in the queue.
  if (req.field === "EMAIL") {
    const taken = await prisma.user.findFirst({
      where:  { email: req.newValue, NOT: { id: req.userId } },
      select: { id: true },
    });
    if (taken) return fail("That email now belongs to another account. Reject this request.");
  }

  const previousEmail = req.user.email;

  await prisma.$transaction(async (tx) => {
    await applyContactChange(tx, req.field, req.userId, req.newValue);

    await tx.profileChangeRequest.update({
      where: { id: req.id },
      data: {
        status:     "APPROVED",
        reviewerId: reviewer.id,
        reviewNote: note ? String(note).slice(0, 500) : null,
        reviewedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        actorId:  reviewer.id,
        action:   "profile.change_approved",
        entity:   "User",
        entityId: req.userId,
        metadata: { field: req.field, from: req.currentValue, to: req.newValue, requestId: req.id },
      },
    });
  });

  // Best-effort notification — same behaviour as a self-approved change, so it
  // lives in the shared helper. The change is already committed; a mail hiccup
  // must not roll it back.
  await notifyContactChange({ field: req.field, newValue: req.newValue, previousEmail });

  revalidatePath("/dashboard/profile-requests");
  revalidatePath("/dashboard/settings");
  return ok("Request approved.");
}

export async function rejectChangeAction(requestId, note) {
  const reviewer = await requireRole(["ADMIN", "MODERATOR"], "/dashboard/profile-requests");

  const req = await prisma.profileChangeRequest.findUnique({ where: { id: String(requestId) } });
  if (!req)                     return fail("Request not found.");
  if (req.status !== "PENDING") return fail("This request has already been reviewed.");

  await prisma.$transaction(async (tx) => {
    await tx.profileChangeRequest.update({
      where: { id: req.id },
      data: {
        status:     "REJECTED",
        reviewerId: reviewer.id,
        reviewNote: note ? String(note).slice(0, 500) : null,
        reviewedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        actorId:  reviewer.id,
        action:   "profile.change_rejected",
        entity:   "User",
        entityId: req.userId,
        metadata: { field: req.field, to: req.newValue, requestId: req.id, note: note || null },
      },
    });
  });

  revalidatePath("/dashboard/profile-requests");
  revalidatePath("/dashboard/settings");
  return ok("Request rejected.");
}
