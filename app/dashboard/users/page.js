// app/dashboard/users/page.js — ADMIN only.
//
// TODO: role-change actions (promote / demote), user search / filter, ban
// flow, password reset trigger. Currently this is a read-only table.

import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";

export default async function DashboardUsers() {
  await requireRole("ADMIN", "/dashboard/users");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, email: true, name: true, role: true, createdAt: true,
      _count: { select: { orders: true, productsAdded: true } },
    },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Users</h1>
        <p className="text-sm text-gray-500 mt-1">All accounts in the system. {users.length} total.</p>
      </header>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="text-left px-4 py-3">Username / Email</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Orders</th>
              <th className="text-left px-4 py-3">Products</th>
              <th className="text-left px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.name || "—"}</td>
                <td className="px-4 py-3"><RolePill role={u.role} /></td>
                <td className="px-4 py-3 text-gray-500">{u._count.orders}</td>
                <td className="px-4 py-3 text-gray-500">{u._count.productsAdded}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {users.map((u) => (
          <div key={u.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{u.email}</div>
                {u.name && <div className="text-xs text-gray-500 truncate">{u.name}</div>}
              </div>
              <RolePill role={u.role} />
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>{u._count.orders} orders</span>
              <span>{u._count.productsAdded} products</span>
              <span className="ml-auto">{new Date(u.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RolePill({ role }) {
  const map = {
    ADMIN:     "bg-eco-green/15 text-eco-green",
    MODERATOR: "bg-blue-100     text-blue-700",
    CUSTOMER:  "bg-gray-100     text-gray-700",
  };
  return <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${map[role]}`}>{role}</span>;
}
