// app/dashboard/users/page.js — ADMIN only.
//
// TODO: user search / filter, ban flow, password reset trigger.
// Role promote/demote is live (see RoleSelect + _actions.js).

import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { getT } from "../../../lib/i18n/server";
import RoleSelect from "./_components/RoleSelect";

export default async function DashboardUsers() {
  const { t } = await getT();
  const me = await requireRole("ADMIN", "/dashboard/users");

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
        <h1 className="text-2xl sm:text-3xl font-bold">{t("dashboard.users")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("dashboard.usersSubtitle", { count: users.length })}</p>
      </header>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="text-left px-4 py-3">{t("dashboard.colUsernameEmail")}</th>
              <th className="text-left px-4 py-3">{t("dashboard.colName")}</th>
              <th className="text-left px-4 py-3">{t("dashboard.colRole")}</th>
              <th className="text-left px-4 py-3">{t("dashboard.colOrders")}</th>
              <th className="text-left px-4 py-3">{t("dashboard.colProducts")}</th>
              <th className="text-left px-4 py-3">{t("dashboard.colJoined")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.name || "—"}</td>
                <td className="px-4 py-3"><RoleSelect userId={u.id} role={u.role} isSelf={u.id === me.id} /></td>
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
              <RoleSelect userId={u.id} role={u.role} isSelf={u.id === me.id} />
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>{u._count.orders}{t("dashboard.ordersSuffix")}</span>
              <span>{u._count.productsAdded}{t("dashboard.productsSuffix")}</span>
              <span className="ml-auto">{new Date(u.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
