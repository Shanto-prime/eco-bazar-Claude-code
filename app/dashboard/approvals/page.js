// app/dashboard/approvals/page.js — ADMIN only.
// Pending moderator requests (product deletions, order cancellations) awaiting
// review. Approving performs the real action; see _actions.js.

import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { getT } from "../../../lib/i18n/server";
import ApprovalsBoard from "./ApprovalsBoard";

export default async function ApprovalsPage() {
  const { t } = await getT();
  await requireRole("ADMIN", "/dashboard/approvals");

  const requests = await prisma.approvalRequest.findMany({
    where:   { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { requester: { select: { name: true, email: true } } },
  });

  const rows = requests.map((r) => ({
    id: r.id,
    type: r.type,
    entityLabel: r.entityLabel || r.entityId,
    requester: r.requester?.name || r.requester?.email || "—",
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("dashboard.approvals")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("dashboard.approvalsSubtitle", { count: rows.length })}</p>
      </header>
      <ApprovalsBoard requests={rows} />
    </div>
  );
}
