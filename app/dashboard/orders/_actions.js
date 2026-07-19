"use server";

// app/dashboard/orders/_actions.js — ADMIN-only order mutations.
// Same shape as users/_actions.js: re-check role (defence in depth, even though
// the page is already gated), Zod-validate, mutate + AuditLog, revalidate.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";

export const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

const StatusSchema = z.object({
  orderId: z.string().min(1),
  status:  z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

// Change an order's fulfilment status. Writes three things atomically:
// the order row, an append-only OrderStatusEvent (what the customer timeline
// reads), and the AuditLog row every privileged write owes.
export async function updateOrderStatusAction(input) {
  const actor = await requireRole("ADMIN", "/dashboard/orders");

  let data;
  try { data = StatusSchema.parse(input); }
  catch { return { ok: false, error: "Invalid input." }; }

  const order = await prisma.order.findUnique({
    where:  { id: data.orderId },
    select: { id: true, status: true, number: true },
  });
  if (!order) return { ok: false, error: "Order not found." };
  if (order.status === data.status) return { ok: true }; // no-op, no history noise

  // A cancelled or delivered order is terminal — reopening it would let stock
  // and payment state drift apart from the fulfilment state with no way back.
  if (order.status === "CANCELLED" || order.status === "DELIVERED") {
    return { ok: false, error: `Order is ${order.status.toLowerCase()} and can't be changed.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: data.orderId },
      data:  { status: data.status },
    });
    await tx.orderStatusEvent.create({
      data: { orderId: data.orderId, status: data.status, actorId: actor.id },
    });
    await tx.auditLog.create({
      data: {
        actorId:  actor.id,
        action:   "order.status.update",
        entity:   "Order",
        entityId: data.orderId,
        metadata: { number: order.number, from: order.status, to: data.status },
      },
    });
  });

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
  return { ok: true };
}
