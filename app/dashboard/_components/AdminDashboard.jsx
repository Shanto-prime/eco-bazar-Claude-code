// app/dashboard/_components/AdminDashboard.jsx
// Admin overview. Shows summary cards (orders count, revenue stub, users
// count, etc.) and links to each management area.
//
// TODO: wire revenue chart, stock alerts feed, and recent audit-log preview
// once those dashboards are properly built out.

import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { formatMoney } from "../../../lib/money";

export default async function AdminDashboard({ user }) {
  const [products, lowStock, orders, pendingOrders, users, reviews, revenueAgg] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { stock: { lt: 5 } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
    prisma.review.count({ where: { approved: false } }),
    // Real revenue = sum of order totals whose payment has settled.
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
  ]);

  // `total` is stored in integer cents; formatMoney converts to a $ string.
  const revenue = formatMoney(revenueAgg._sum.total || 0);

  const stats = [
    { label: "Products",            value: products,      href: "/dashboard/products",                color: "bg-eco-green" },
    { label: "Low stock (<5)",      value: lowStock,      href: "/dashboard/products?lowStock=1",     color: "bg-amber-500" },
    { label: "Orders",              value: orders,        href: "/dashboard/orders",                  color: "bg-blue-500" },
    { label: "Pending orders",      value: pendingOrders, href: "/dashboard/orders?status=PENDING",   color: "bg-purple-500" },
    { label: "Users",               value: users,         href: "/dashboard/users",                   color: "bg-gray-700" },
    { label: "Reviews to moderate", value: reviews,       href: "/dashboard/reviews",                 color: "bg-pink-500" },
    { label: "Revenue (paid)",      value: revenue,       href: "/dashboard/orders",                  color: "bg-emerald-600" },
    { label: "Audit log",           value: "→",           href: "/dashboard/audit-log",               color: "bg-slate-700" },
  ];

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Welcome, {user.name || user.email}</h1>
        <p className="text-sm text-gray-500 mt-1">You&apos;re signed in as <b>ADMIN</b> — full access.</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition flex items-center gap-3 sm:gap-4 min-h-[80px]"
          >
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${s.color} text-white grid place-items-center font-bold text-sm`}>
              {s.value}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{s.label}</div>
              <div className="text-xs text-gray-500">Manage</div>
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-lg sm:text-xl font-bold mb-3">Quick links</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-eco-green text-white text-sm min-h-[44px]">
            <i className="fa-solid fa-plus" /> Add product
          </Link>
          <Link href="/dashboard/users" className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 text-sm min-h-[44px]">
            <i className="fa-solid fa-user-shield" /> Manage users
          </Link>
          <Link href="/dashboard/audit-log" className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 text-sm min-h-[44px]">
            <i className="fa-solid fa-clipboard-list" /> View audit log
          </Link>
        </div>
      </section>
    </div>
  );
}
