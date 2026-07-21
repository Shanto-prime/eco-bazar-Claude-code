// app/dashboard/profile-requests/page.js — ADMIN only.
//
// Review queue for email/phone changes raised at /dashboard/settings by both
// customers and moderators. ADMIN is the sole approver: moderators submit here
// like anyone else and only the admin decides (see lib/profile-changes.js). No
// ownership rule — every decision is logged with the reviewer's id.
//
// The server loads the data; RequestsBoard (client) owns all interaction —
// filtering, the reject modal, and the optimistic list updates.

import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { getT } from "../../../lib/i18n/server";
import RequestsBoard from "./_components/RequestsBoard";

export default async function ProfileRequests() {
  const { t } = await getT();
  await requireRole("ADMIN", "/dashboard/profile-requests");

  const userSelect   = { select: { name: true, email: true, username: true, role: true } };
  const [pending, reviewed] = await Promise.all([
    prisma.profileChangeRequest.findMany({
      where:   { status: "PENDING" },
      orderBy: { createdAt: "asc" },   // oldest first — a queue, not a feed
      include: { user: userSelect },
    }),
    prisma.profileChangeRequest.findMany({
      where:   { status: { not: "PENDING" } },
      orderBy: { reviewedAt: "desc" },
      take:    25,
      include: { user: userSelect, reviewer: { select: { name: true, email: true } } },
    }),
  ]);

  // Flatten to plain, serialisable rows for the client component. Dates go over
  // as ISO strings (Date objects don't survive the server→client boundary in a
  // form the UI can format).
  const toRow = (r) => ({
    id:           r.id,
    field:        r.field,
    currentValue: r.currentValue,
    newValue:     r.newValue,
    status:       r.status,
    reviewNote:   r.reviewNote,
    createdAt:    r.createdAt.toISOString(),
    userName:     r.user?.name || "",
    userEmail:    r.user?.email || "",
    userUsername: r.user?.username || "",
    userRole:     r.user?.role || "CUSTOMER",
    reviewerName: r.reviewer?.name || r.reviewer?.email || "",
  });

  return (
    <div className="max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t("requests.title")}</h1>
        <p className="mt-1.5 text-sm text-gray-500">{t("requests.subtitleFull")}</p>
      </header>

      <RequestsBoard pending={pending.map(toRow)} resolved={reviewed.map(toRow)} />
    </div>
  );
}
