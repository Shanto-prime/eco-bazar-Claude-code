// app/dashboard/profile-requests/page.js — ADMIN + MODERATOR.
//
// Review queue for email/phone changes raised at /dashboard/settings. Unlike
// the product pages there is no ownership rule here: any moderator may review
// any request, and every decision lands in the audit log with the reviewer's id.

import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { getT } from "../../../lib/i18n/server";
import ReviewActions from "./_components/ReviewActions";

const STATUS_STYLE = {
  PENDING:   "bg-amber-100 text-amber-700",
  APPROVED:  "bg-emerald-100 text-emerald-700",
  REJECTED:  "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export default async function ProfileRequests() {
  const { t } = await getT();
  await requireRole(["ADMIN", "MODERATOR"], "/dashboard/profile-requests");

  const userSelect = { select: { name: true, email: true, username: true } };
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

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("requests.title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("requests.subtitle", { count: pending.length })}</p>
      </header>

      {pending.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-500 bg-white">
          {t("requests.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((r) => (
            <article key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium">{r.user.name || r.user.username || r.user.email}</div>
                  <div className="text-xs text-gray-500">{r.user.email}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLE.PENDING}`}>
                  {t(r.field === "EMAIL" ? "settings.email" : "settings.phone")}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
                <span className="text-gray-500 line-through truncate max-w-[240px]">
                  {r.currentValue || t("settings.notSet")}
                </span>
                <i className="fa-solid fa-arrow-right text-gray-400 text-xs" />
                <span className="font-medium truncate max-w-[240px]">{r.newValue}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </div>

              {r.field === "EMAIL" && (
                <p className="text-xs text-gray-500 mt-2">
                  <i className="fa-solid fa-circle-info mr-1" />{t("requests.emailNote")}
                </p>
              )}

              <ReviewActions requestId={r.id} />
            </article>
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm uppercase tracking-wide text-gray-400 mb-2">{t("requests.history")}</h2>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {reviewed.map((r) => (
              <div key={r.id} className="p-3 flex flex-wrap items-center gap-2 text-sm">
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status]}`}>
                  {t(`settings.status${r.status}`)}
                </span>
                <span className="truncate max-w-[160px]">{r.user.name || r.user.email}</span>
                <span className="text-gray-400 text-xs">
                  {t(r.field === "EMAIL" ? "settings.email" : "settings.phone")}
                </span>
                <span className="truncate max-w-[200px] text-gray-500">{r.newValue}</span>
                {r.reviewer && (
                  <span className="text-xs text-gray-400">
                    {t("requests.by")} {r.reviewer.name || r.reviewer.email}
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : ""}
                </span>
                {r.reviewNote && (
                  <span className="basis-full text-xs text-gray-500">“{r.reviewNote}”</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
