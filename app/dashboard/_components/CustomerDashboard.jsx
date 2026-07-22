// app/dashboard/_components/CustomerDashboard.jsx
// Customer overview: profile snapshot, recent order list, wishlist link.
//
// TODO: full order history filters, saved addresses CRUD, password change UI.

import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { formatMoney } from "../../../lib/money";
import { getActiveCurrency } from "../../../lib/store-config";
import { getT } from "../../../lib/i18n/server";

export default async function CustomerDashboard({ user }) {
  const { t } = await getT();
  const cur = await getActiveCurrency();
  // Lightweight order count — full history lives at /dashboard/orders.
  const orderCount = await prisma.order.count({ where: { userId: user.id } });

  // Most recent five orders (basic list — fuller table on /dashboard/orders).
  const recent = await prisma.order.findMany({
    where:   { userId: user.id },
    orderBy: { createdAt: "desc" },
    take:    5,
    select:  { id: true, number: true, total: true, status: true, createdAt: true },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("dashboard.hi", { name: user.name || user.email })}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("dashboard.accountOverview")}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-8">
        <Link href="/dashboard/orders" className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
          <div className="text-xs uppercase tracking-wider text-gray-500">{t("dashboard.totalOrders")}</div>
          <div className="text-2xl font-bold mt-1">{orderCount}</div>
          <div className="text-xs text-eco-green mt-1">{t("dashboard.viewOrderHistory")}</div>
        </Link>
        <Link href="/wishlist" className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
          <div className="text-xs uppercase tracking-wider text-gray-500">{t("dashboard.wishlist")}</div>
          <div className="text-2xl font-bold mt-1"><i className="fa-regular fa-heart text-red-400" /></div>
          <div className="text-xs text-eco-green mt-1">{t("dashboard.openWishlist")}</div>
        </Link>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="text-xs uppercase tracking-wider text-gray-500">{t("dashboard.profile")}</div>
          <div className="font-medium mt-1 truncate">{user.email}</div>
          <div className="text-xs text-gray-500 mt-1">{t("dashboard.customerAccount")}</div>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-lg sm:text-xl font-bold mb-3">{t("dashboard.recentOrders")}</h2>
        {recent.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 bg-white">
            {t("dashboard.noOrders")}{" "}
            <Link href="/shop" className="text-eco-green underline">{t("dashboard.browseShop")}</Link>.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3">{t("dashboard.orderNumber")}</th>
                    <th className="text-left px-4 py-3">{t("dashboard.status")}</th>
                    <th className="text-left px-4 py-3">{t("dashboard.totalCol")}</th>
                    <th className="text-left px-4 py-3">{t("dashboard.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{o.number}</td>
                      <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                      <td className="px-4 py-3">{formatMoney(o.total, cur)}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {recent.map((o) => (
                <div key={o.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{o.number}</div>
                    <StatusPill status={o.status} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(o.createdAt).toLocaleDateString()}</div>
                  <div className="text-sm font-semibold mt-2">{formatMoney(o.total, cur)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section>
        <h2 className="text-lg sm:text-xl font-bold mb-3">{t("dashboard.savedAddresses")}</h2>
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 bg-white">
          {/* TODO: implement saved-addresses CRUD (Address model + page). */}
          {t("dashboard.noAddresses")}
        </div>
      </section>
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
  return <span className={`text-xs px-2 py-1 rounded-full ${map[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}
