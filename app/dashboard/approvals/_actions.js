"use server";

// app/dashboard/approvals/_actions.js   ADMIN review of moderator requests.
// approveRequest performs the real action (delete product / cancel order) as if
// the admin had done it directly, then marks the request APPROVED. rejectRequest
// closes it with an optional note. Both are defence-in-depth ADMIN-gated and
// write an AuditLog row.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { assertNotDemo } from "../../../lib/demo-accounts";
import { isTerminal } from "../../../lib/order-status";
import { restockCancelledOrder } from "../../../lib/inventory";

export async function approveRequest(input) {
    const admin = await requireRole("ADMIN", "/dashboard/approvals");
    const blocked = assertNotDemo(admin);
    if (blocked) return blocked;
    const requestId = typeof input === "string" ? input : input?.requestId;
    if (!requestId) return { ok: false, error: "Invalid input." };

    const req = await prisma.approvalRequest.findUnique({
        where: { id: requestId },
    });
    if (!req) return { ok: false, error: "Request not found." };
    if (req.status !== "PENDING")
        return { ok: false, error: "This request was already reviewed." };

    try {
        await prisma.$transaction(async (tx) => {
            if (req.type === "PRODUCT_DELETE") {
                const product = await tx.product.findUnique({
                    where: { id: req.entityId },
                    select: { slug: true, name: true },
                });
                if (product) {
                    await tx.product.delete({ where: { id: req.entityId } });
                    await tx.auditLog.create({
                        data: {
                            actorId: admin.id,
                            action: "product.delete",
                            entity: "Product",
                            entityId: req.entityId,
                            metadata: {
                                slug: product.slug,
                                name: product.name,
                                viaRequest: req.id,
                                requesterId: req.requesterId,
                            },
                        },
                    });
                }
            } else if (req.type === "ORDER_CANCEL") {
                const order = await tx.order.findUnique({
                    where: { id: req.entityId },
                    select: { id: true, status: true, number: true },
                });
                if (order && !isTerminal(order.status)) {
                    await tx.order.update({
                        where: { id: order.id },
                        data: { status: "CANCELLED" },
                    });
                    // Release the stock this order reserved   same rule as an admin
                    // cancelling directly (see dashboard/orders/_actions.js).
                    await restockCancelledOrder(tx, order.id);
                    await tx.orderStatusEvent.create({
                        data: {
                            orderId: order.id,
                            status: "CANCELLED",
                            actorId: admin.id,
                        },
                    });
                    await tx.auditLog.create({
                        data: {
                            actorId: admin.id,
                            action: "order.status.update",
                            entity: "Order",
                            entityId: order.id,
                            metadata: {
                                number: order.number,
                                from: order.status,
                                to: "CANCELLED",
                                viaRequest: req.id,
                                requesterId: req.requesterId,
                            },
                        },
                    });
                }
            }

            await tx.approvalRequest.update({
                where: { id: req.id },
                data: {
                    status: "APPROVED",
                    reviewerId: admin.id,
                    reviewedAt: new Date(),
                },
            });
        });
    } catch (e) {
        return {
            ok: false,
            error: e?.message || "Could not approve the request.",
        };
    }

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard");
    revalidatePath("/shop");
    return { ok: true };
}

const RejectSchema = z.object({
    requestId: z.string().min(1),
    note: z.string().max(500).optional(),
});

export async function rejectRequest(input) {
    const admin = await requireRole("ADMIN", "/dashboard/approvals");
    const blocked = assertNotDemo(admin);
    if (blocked) return blocked;

    let data;
    try {
        data = RejectSchema.parse(input);
    } catch {
        return { ok: false, error: "Invalid input." };
    }

    const req = await prisma.approvalRequest.findUnique({
        where: { id: data.requestId },
        select: { id: true, status: true, type: true, entityId: true },
    });
    if (!req) return { ok: false, error: "Request not found." };
    if (req.status !== "PENDING")
        return { ok: false, error: "This request was already reviewed." };

    await prisma.$transaction(async (tx) => {
        await tx.approvalRequest.update({
            where: { id: req.id },
            data: {
                status: "REJECTED",
                reviewerId: admin.id,
                reviewedAt: new Date(),
                reviewNote: data.note || null,
            },
        });
        await tx.auditLog.create({
            data: {
                actorId: admin.id,
                action: "approval.reject",
                entity: "ApprovalRequest",
                entityId: req.id,
                metadata: { type: req.type, entityId: req.entityId },
            },
        });
    });

    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard");
    return { ok: true };
}
