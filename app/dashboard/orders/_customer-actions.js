"use server";

// app/dashboard/orders/_customer-actions.js
// Customer-callable order mutations. Split from _actions.js (which is
// ADMIN/MODERATOR-only) so this file's auth check is a plain `requireAuth`,
// not `requireRole`. Both are called from the same OrderDetails modal.
//
// Currently one action: requestReturnAction   a customer's one allowed
// transition OUT of DELIVERED, within 15 days of delivery. Flips the order
// to CANCELLED (releasing stock via the shared restock helper) and stamps an
// OrderStatusEvent so the timeline shows the request in place.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth-helpers";
import { canRequestReturn } from "../../../lib/order-return";
import { restockCancelledOrder } from "../../../lib/inventory";
import { assertNotDemo } from "../../../lib/demo-accounts";

const Schema = z.object({ orderId: z.string().min(1) });

const ReviewSchema = z.object({
    orderId: z.string().min(1),
    productId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    body: z
        .string()
        .min(1)
        .max(2000)
        .transform((s) => s.trim()),
});

export async function requestReturnAction(input) {
    const user = await requireAuth("/dashboard/orders");
    const blocked = assertNotDemo(user);
    if (blocked) return blocked;

    let data;
    try {
        data = Schema.parse(input);
    } catch {
        return { ok: false, error: "Invalid input." };
    }

    const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        select: {
            id: true,
            number: true,
            status: true,
            userId: true,
            history: {
                orderBy: { createdAt: "asc" },
                select: { status: true, createdAt: true },
            },
        },
    });

    const check = canRequestReturn({
        viewerId: user.id,
        order,
        now: Date.now(),
    });
    if (!check.ok) {
        const map = {
            notFound: "Order not found.",
            notOwner: "This order isn't yours.",
            notDelivered: "Only delivered orders can be returned.",
            windowClosed: `Return window has expired (${15} days after delivery).`,
        };
        return { ok: false, error: map[check.reason] || "Return not allowed." };
    }

    await prisma.$transaction(async (tx) => {
        await tx.order.update({
            where: { id: data.orderId },
            // Reusing CANCELLED for the terminal "returned" state so we don't need
            // to widen the OrderStatus enum. The note on the timeline event makes
            // "return by customer" vs "cancelled by staff" distinguishable.
            data: { status: "CANCELLED" },
        });
        // Same restock logic as an admin cancel   the items go back on the shelf.
        await restockCancelledOrder(tx, data.orderId);
        await tx.orderStatusEvent.create({
            data: {
                orderId: data.orderId,
                status: "CANCELLED",
                actorId: user.id,
                note: "Return requested by customer",
            },
        });
        await tx.auditLog.create({
            data: {
                actorId: user.id,
                action: "order.return.request",
                entity: "Order",
                entityId: data.orderId,
                metadata: {
                    number: order.number,
                    from: "DELIVERED",
                    to: "CANCELLED",
                },
            },
        });
    });

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard");
    return { ok: true };
}

// Submit a review for one product the customer bought. Requires:
//   • the order belongs to the caller
//   • the order is DELIVERED (no reviewing orders that never arrived)
//   • the product appears as one of the OrderItem rows on that order
//   • the customer hasn't already reviewed this product (schema-enforced by
//     the @@unique([productId, userId]) index   we still check to return a
//     nicer error than P2002)
//
// Also updates Product.rating to the running average of approved reviews so
// storefront cards + the shop's star filter reflect the change immediately.
// Auto-approved for now   there's no moderation UI wired up yet.
export async function submitReviewAction(input) {
    const user = await requireAuth("/dashboard/orders");
    const blocked = assertNotDemo(user);
    if (blocked) return blocked;

    let data;
    try {
        data = ReviewSchema.parse(input);
    } catch {
        return {
            ok: false,
            error: "Invalid review (rating 1–5, body required).",
        };
    }

    const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        select: {
            id: true,
            status: true,
            userId: true,
            items: {
                where: { productId: data.productId },
                select: { id: true, productSlug: true },
            },
        },
    });
    if (!order) return { ok: false, error: "Order not found." };
    if (order.userId !== user.id)
        return { ok: false, error: "This order isn't yours." };
    if (order.status !== "DELIVERED")
        return { ok: false, error: "You can only review delivered orders." };
    if (order.items.length === 0)
        return { ok: false, error: "That product wasn't in this order." };

    const existing = await prisma.review.findUnique({
        where: {
            productId_userId: { productId: data.productId, userId: user.id },
        },
        select: { id: true },
    });
    if (existing)
        return { ok: false, error: "You've already reviewed this product." };

    await prisma.$transaction(async (tx) => {
        await tx.review.create({
            data: {
                productId: data.productId,
                userId: user.id,
                rating: data.rating,
                body: data.body,
                approved: true,
            },
        });
        // Recompute the product's rolling average from ALL approved reviews
        // (including the one we just inserted).
        const agg = await tx.review.aggregate({
            where: { productId: data.productId, approved: true },
            _avg: { rating: true },
        });
        const avg = Number(agg._avg.rating || 0);
        // Rounded to one decimal   matches the display format in ProductCard.
        await tx.product.update({
            where: { id: data.productId },
            data: { rating: Math.round(avg * 10) / 10 },
        });
        await tx.auditLog.create({
            data: {
                actorId: user.id,
                action: "review.create",
                entity: "Product",
                entityId: data.productId,
                metadata: { orderId: data.orderId, rating: data.rating },
            },
        });
    });

    const slug = order.items[0]?.productSlug;
    revalidatePath("/dashboard/orders");
    if (slug) revalidatePath(`/shop/${slug}`);
    return { ok: true };
}
