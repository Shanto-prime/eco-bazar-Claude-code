// app/dashboard/orders/page.js
// All authenticated users may view this page, but the data set is scoped by
// role server-side:
//   • CUSTOMER  → only their own orders
//   • MODERATOR → all orders, read-only (no admin actions)
//   • ADMIN     → all orders, plus an inline status picker per row
//
// Status changes are recorded in OrderStatusEvent (append-only), which is what
// the customer-facing timeline reads — Order.updatedAt can't be used for that
// because it moves on any write to the row.
//
// TODO: filter/search by status, date range, customer.
// TODO: order detail page with line items.

import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth-helpers";
import { formatMoney } from "../../../lib/money";
import { getT } from "../../../lib/i18n/server";
import LocalTime from "../../../components/LocalTime";
import StatusSelect from "./_components/StatusSelect";

export default async function DashboardOrders() {
  const { t } = await getT();
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
      history: {
        orderBy: { createdAt: "asc" },
        select: { id: true, status: true, createdAt: true, actor: { select: { name: true, email: true } } },
      },
    },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {user.role === "CUSTOMER" ? t("dashboard.myOrders") : t("dashboard.orders")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {user.role === "ADMIN"     && t("dashboard.ordersAllSystem")}
          {user.role === "MODERATOR" && t("dashboard.ordersAllReadOnly")}
          {user.role === "CUSTOMER"  && t("dashboard.ordersYourHistory")}
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-500 bg-white">
          {user.role === "CUSTOMER"
            ? <>{t("dashboard.noOrders")} <Link href="/shop" className="text-eco-green underline">{t("dashboard.browseShop")}</Link>.</>
            : t("dashboard.noOrdersSystem")}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">{t("dashboard.orderNumber")}</th>
                  {user.role !== "CUSTOMER" && <th className="text-left px-4 py-3">{t("dashboard.colCustomer")}</th>}
                  <th className="text-left px-4 py-3">{t("dashboard.colItems")}</th>
                  <th className="text-left px-4 py-3">{t("dashboard.totalCol")}</th>
                  <th className="text-left px-4 py-3">{t("dashboard.status")}</th>
                  <th className="text-left px-4 py-3">{t("dashboard.colPlaced")}</th>
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
                    <td className="px-4 py-3">
                      {user.role === "ADMIN"
                        ? <StatusSelect orderId={o.id} status={o.status} />
                        : <StatusPill status={o.status} />}
                    </td>
                    <td className="px-4 py-3 text-gray-500 align-top">
                      <LocalTime value={o.createdAt} />
                      <Timeline history={o.history} t={t} />
                    </td>
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
                    <div className="text-xs text-gray-500 mt-1">
                      <LocalTime value={o.createdAt} /> · {t(o._count.items === 1 ? "dashboard.items_one" : "dashboard.items_other", { count: o._count.items })}
                    </div>
                  </div>
                  {user.role === "ADMIN"
                    ? <StatusSelect orderId={o.id} status={o.status} />
                    : <StatusPill status={o.status} />}
                </div>
                <div className="text-sm font-semibold mt-2">{formatMoney(o.total)}</div>
                <Timeline history={o.history} t={t} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Append-only status history for one order. The first event is the order's own
// creation (actor null — the purchase itself), so a brand-new order still shows
// a one-entry timeline rather than nothing. Rendered for every role: customers
// use it to see progress, admins to see what they changed and when.
function Timeline({ history, t }) {
  if (!history?.length) return null;

  return (
    <ol className="mt-2 space-y-1 border-l border-gray-200 pl-3">
      {history.map((h) => (
        <li key={h.id} className="text-xs text-gray-500 relative">
          <span className="absolute -left-[15px] top-1.5 w-1.5 h-1.5 rounded-full bg-gray-300" />
          <span className="font-medium text-gray-700">
            {t(`dashboard.status${h.status[0]}${h.status.slice(1).toLowerCase()}`)}
          </span>
          {" · "}
          <LocalTime value={h.createdAt} />
          {h.actor && (
            <span className="text-gray-400"> · {h.actor.name || h.actor.email}</span>
          )}
        </li>
      ))}
    </ol>
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
