// app/dashboard/users/page.js — ADMIN only.
//
// Role promote/demote is live (RoleSelect), plus admin can create staff
// accounts (CreateUserForm) and delete users (DeleteUserButton). The super
// admin (founding account) is badged and locked against role change + deletion.

import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { getT } from "../../../lib/i18n/server";
import RoleSelect from "./_components/RoleSelect";
import DeleteUserButton from "./_components/DeleteUserButton";
import CreateUserForm from "./_components/CreateUserForm";
import LocalTime from "../../../components/LocalTime";

export default async function DashboardUsers() {
  const { t } = await getT();
  const me = await requireRole("ADMIN", "/dashboard/users");

  const users = await prisma.user.findMany({
    orderBy: [{ isSuperAdmin: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, email: true, name: true, role: true, createdAt: true, isSuperAdmin: true,
      _count: { select: { orders: true, productsAdded: true } },
    },
  });

  const NameCell = ({ u }) => (
    <span className="inline-flex items-center gap-2">
      {u.name || "—"}
      {u.isSuperAdmin && (
        <span className="inline-flex items-center gap-1 rounded-full bg-eco-green/10 text-eco-green text-[10px] font-semibold px-2 py-0.5">
          <i className="fa-solid fa-crown" /> {t("dashboard.superAdmin")}
        </span>
      )}
    </span>
  );

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("dashboard.users")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("dashboard.usersSubtitle", { count: users.length })}</p>
        </div>
        <CreateUserForm />
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
              <th className="text-right px-4 py-3">{t("dashboard.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3 text-gray-600"><NameCell u={u} /></td>
                <td className="px-4 py-3"><RoleSelect userId={u.id} role={u.role} isSelf={u.id === me.id} superAdmin={u.isSuperAdmin} /></td>
                <td className="px-4 py-3 text-gray-500">{u._count.orders}</td>
                <td className="px-4 py-3 text-gray-500">{u._count.productsAdded}</td>
                <td className="px-4 py-3 text-gray-500"><LocalTime value={u.createdAt} dateOnly /></td>
                <td className="px-4 py-3 text-right">
                  <DeleteUserButton
                    userId={u.id}
                    label={u.name || u.email}
                    disabled={u.isSuperAdmin || u.id === me.id}
                    reason={u.isSuperAdmin ? t("dashboard.superAdminLocked") : t("dashboard.cantDeleteSelf")}
                  />
                </td>
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
                <div className="text-xs text-gray-500 truncate"><NameCell u={u} /></div>
              </div>
              <RoleSelect userId={u.id} role={u.role} isSelf={u.id === me.id} superAdmin={u.isSuperAdmin} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>{u._count.orders}{t("dashboard.ordersSuffix")}</span>
              <span>{u._count.productsAdded}{t("dashboard.productsSuffix")}</span>
              <span><LocalTime value={u.createdAt} dateOnly /></span>
              <span className="ml-auto">
                <DeleteUserButton
                  userId={u.id}
                  label={u.name || u.email}
                  disabled={u.isSuperAdmin || u.id === me.id}
                  reason={u.isSuperAdmin ? t("dashboard.superAdminLocked") : t("dashboard.cantDeleteSelf")}
                />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
