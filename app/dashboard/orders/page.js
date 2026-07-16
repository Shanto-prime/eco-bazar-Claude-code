// app/dashboard/orders/page.js
// All authenticated users may view this page, but the data set is scoped by
// role server-side:
//   • CUSTOMER  → only their own orders
//   • MODERATOR → all orders, read-only (no admin actions)
//   • ADMIN     → all orders, with full actions (status edits TODO)
//
// TODO: filter/search by status, date range, customer.
// TODO: order detail page with line items + status-change action (admin).

import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth-helpers";
import { formatMoney } from "../../../lib/money";

export default async function DashboardOrders() {
  const user = await requireAuth("/dashboard/orders");

  const where = user.role === "CUSTOMER" ? { userId: user.id } : {};
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, number: true, total: true, status: true, createdAt: true,
      email: true, firstName: true, lastName: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {user.role === "CUSTOMER" ? "My orders" : "Orders"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {user.role === "ADMIN"     && "All orders, system-wide."}
          {user.role === "MODERATOR" && "All orders (read-only)."}
          {user.role === "CUSTOMER"  && "Your order history."}
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-500 bg-white">
          {user.role === "CUSTOMER"
            ? <>You haven&apos;t placed any orders yet. <Link href="/shop" className="text-eco-green underline">Browse the shop</Link>.</>
            : "No orders in the system yet."}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Order #</th>
                  {user.role !== "CUSTOMER" && <th className="text-left px-4 py-3">Customer</th>}
                  <th className="text-left px-4 py-3">Items</th>
                  <th className="text-left px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{o.number}</td>
                    {user.role !== "CUSTOMER" && (
                      <td className="px-4 py-3 text-gray-600">
                        <div>{o.firstName} {o.lastName}</div>
                        <div className="text-xs text-gray-500">{o.email}</div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-500">{o._count.items}</td>
                    <td className="px-4 py-3 font-semibold">{formatMoney(o.total)}</td>
                    <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{o.number}</div>
                    {user.role !== "CUSTOMER" && (
                      <div className="text-xs text-gray-500 truncate">{o.firstName} {o.lastName} — {o.email}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">{new Date(o.createdAt).toLocaleDateString()} · {o._count.items} item{o._count.items === 1 ? "" : "s"}</div>
                  </div>
                  <StatusPill status={o.status} />
                </div>
                <div className="text-sm font-semibold mt-2">{formatMoney(o.total)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    PENDING:   "bg-amber-100  text-amber-700",
    PAID:      "bg-blue-100   text-blue-700",
    SHIPPED:   "bg-purple-100 text-purple-700",
    DELIVERED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-gray-200   text-gray-700",
  };
  return <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${map[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}
