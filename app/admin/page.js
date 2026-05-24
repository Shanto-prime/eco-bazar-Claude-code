// app/admin/page.js — Admin dashboard. Server component that loads aggregate
// stats and lets admins/moderators jump into the workflow.

import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/auth-helpers";

export default async function AdminDashboard() {
  await requireUser({ role: "MODERATOR", redirectTo: "/admin/login" });

  const [products, lowStock, orders, pendingOrders, users, reviews] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { stock: { lt: 5 } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
    prisma.review.count({ where: { approved: false } }),
  ]);

  const stats = [
    { label: "Products",          value: products,      href: "/admin/products", color: "bg-eco-green" },
    { label: "Low stock (<5)",    value: lowStock,      href: "/admin/products?lowStock=1", color: "bg-amber-500" },
    { label: "Orders",            value: orders,        href: "/admin/orders",   color: "bg-blue-500" },
    { label: "Pending orders",    value: pendingOrders, href: "/admin/orders?status=PENDING", color: "bg-purple-500" },
    { label: "Users",             value: users,         href: "/admin/users",    color: "bg-gray-700" },
    { label: "Reviews to moderate", value: reviews,     href: "/admin/reviews",  color: "bg-pink-500" },
  ];

  const recent = await prisma.product.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full ${s.color} text-white grid place-items-center font-bold`}>{s.value}</div>
            <div>
              <div className="font-semibold text-sm">{s.label}</div>
              <div className="text-xs text-gray-500">Click to manage</div>
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recently added products</h2>
          <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-eco-green text-white text-sm">
            <i className="fa-solid fa-plus" /> Add product
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-500">
            No products yet. <Link href="/admin/products/new" className="text-eco-green underline">Add your first product</Link>.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Price</th>
                  <th className="text-left px-4 py-3">Stock</th>
                  <th className="text-left px-4 py-3">Added by</th>
                  <th className="text-left px-4 py-3">When</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${p.id}/edit`} className="font-medium hover:text-eco-green">{p.name}</Link>
                      <div className="text-xs text-gray-500">/{p.slug}</div>
                    </td>
                    <td className="px-4 py-3">${Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={p.stock < 5 ? "text-amber-600 font-semibold" : ""}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.createdBy?.name || p.createdBy?.email}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/products/${p.id}/edit`} className="text-eco-green hover:underline text-sm">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
