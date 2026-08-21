// lib/inventory.js
// Inventory movements that are not part of checkout.
//
// Checkout decrements stock inside lib/order-actions.js. The mirror of that
// returning stock when an order is cancelled   is needed by two call sites
// (an ADMIN cancelling directly in dashboard/orders/_actions.js, and an ADMIN
// approving a MODERATOR's ORDER_CANCEL request in dashboard/approvals), so it
// lives here rather than being written twice.
//
// Plain module, not "use server": these are helpers called from inside an
// existing transaction, not server actions of their own.

import "server-only";

// Give an order's reserved stock back to the catalogue.
//
// MUST be called with the `tx` client of the same transaction that flips the
// order to CANCELLED   otherwise a failure between the two writes would leave
// stock credited for an order that is still open (or vice versa).
//
// Lines whose product has since been deleted have `productId: null` (OrderItem
// sets it null on delete while keeping the name/price snapshot) and are skipped:
// there is no row left to credit.
export async function restockCancelledOrder(tx, orderId) {
    const items = await tx.orderItem.findMany({
        where: { orderId, productId: { not: null } },
        select: { productId: true, qty: true },
    });

    for (const item of items) {
        await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.qty } },
        });
    }

    return items.length;
}
