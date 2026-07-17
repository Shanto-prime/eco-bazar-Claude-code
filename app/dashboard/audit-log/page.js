// app/dashboard/audit-log/page.js — ADMIN only.
//
// TODO: filter by actor, action, entity; export to CSV; date-range filter.

import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { getT } from "../../../lib/i18n/server";

export default async function DashboardAuditLog() {
  const { t } = await getT();
  await requireRole("ADMIN", "/dashboard/audit-log");

  const events = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { name: true, email: true, role: true } } },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("dashboard.auditLog")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("dashboard.auditSubtitle")}</p>
      </header>

      {events.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-500 bg-white">
          {t("dashboard.noAudit")}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">{t("dashboard.colWhen")}</th>
                  <th className="text-left px-4 py-3">{t("dashboard.colActor")}</th>
                  <th className="text-left px-4 py-3">{t("dashboard.colAction")}</th>
                  <th className="text-left px-4 py-3">{t("dashboard.colEntity")}</th>
                  <th className="text-left px-4 py-3">{t("dashboard.colMetadata")}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t align-top">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{e.actor.name || e.actor.email}</div>
                      <div className="text-xs text-gray-500">{e.actor.role}</div>
                    </td>
                    <td className="px-4 py-3"><code className="text-xs bg-gray-100 rounded px-1.5 py-0.5">{e.action}</code></td>
                    <td className="px-4 py-3"><code className="text-xs bg-gray-100 rounded px-1.5 py-0.5">{e.entity}{e.entityId ? ` #${e.entityId.slice(0, 8)}…` : ""}</code></td>
                    <td className="px-4 py-3"><pre className="text-xs text-gray-600 whitespace-pre-wrap break-all max-w-xs">{e.metadata ? JSON.stringify(e.metadata, null, 0) : "—"}</pre></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {events.map((e) => (
              <div key={e.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleString()}</div>
                    <div className="font-medium truncate">{e.actor.name || e.actor.email}</div>
                  </div>
                  <code className="text-[10px] bg-gray-100 rounded px-1.5 py-0.5 whitespace-nowrap">{e.action}</code>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {e.entity}{e.entityId ? ` #${e.entityId.slice(0, 8)}…` : ""}
                </div>
                {e.metadata && (
                  <pre className="mt-2 text-[11px] text-gray-600 whitespace-pre-wrap break-all">{JSON.stringify(e.metadata, null, 0)}</pre>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
