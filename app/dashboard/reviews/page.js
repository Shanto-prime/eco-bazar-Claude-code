// app/dashboard/reviews/page.js — ADMIN + MODERATOR.
//
// TODO: approve / reject server actions with audit-log writes; filter by
// status; jump-to-product link from each row.

import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";

export default async function DashboardReviews() {
  await requireRole(["ADMIN", "MODERATOR"], "/dashboard/reviews");

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user:    { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">Moderate customer reviews. {reviews.length} most recent shown.</p>
      </header>

      {reviews.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-500 bg-white">
          No reviews yet.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <article key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-medium">{r.product.name} <span className="text-xs text-gray-400">/{r.product.slug}</span></div>
                  <div className="text-xs text-gray-500">by {r.user.name || r.user.email} · {new Date(r.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-500 text-sm">{"★".repeat(r.rating)}<span className="text-gray-300">{"★".repeat(5 - r.rating)}</span></span>
                  <span className={`text-xs px-2 py-1 rounded-full ${r.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {r.approved ? "Approved" : "Pending"}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>
              {/* TODO: approve / reject buttons calling server actions. */}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
