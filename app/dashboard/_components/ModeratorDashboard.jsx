// app/dashboard/_components/ModeratorDashboard.jsx
// Moderator overview: product management + review moderation + read-only
// orders. No access to users or audit log.
//
// TODO: surface a "to-do" feed once review queue + flagged-product flows are
// real (e.g. "3 reviews pending your approval").

import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { getT } from "../../../lib/i18n/server";

export default async function ModeratorDashboard({ user }) {
  const { t } = await getT();
  const [myProducts, lowStock, pendingReviews] = await Promise.all([
    prisma.product.count({ where: { createdById: user.id } }),
    prisma.product.count({ where: { createdById: user.id, stock: { lt: 5 } } }),
    prisma.review.count({ where: { approved: false } }),
  ]);

  const stats = [
    { label: t("dashboard.myProducts"),        value: myProducts,     href: "/dashboard/products",            color: "bg-eco-green" },
    { label: t("dashboard.lowStockMine"),      value: lowStock,       href: "/dashboard/products?lowStock=1", color: "bg-amber-500" },
    { label: t("dashboard.reviewsToModerate"), value: pendingReviews, href: "/dashboard/reviews",             color: "bg-pink-500" },
    { label: t("dashboard.ordersReadOnly"),    value: "→",            href: "/dashboard/orders",              color: "bg-blue-500" },
  ];

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("dashboard.welcome", { name: user.name || user.email })}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("dashboard.signedInModerator", { role: t("dashboard.roleModerator") })}</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
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
              <div className="text-xs text-gray-500">{t("dashboard.open")}</div>
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-lg sm:text-xl font-bold mb-3">{t("dashboard.quickLinks")}</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-eco-green text-white text-sm min-h-[44px]">
            <i className="fa-solid fa-plus" /> {t("dashboard.addProduct")}
          </Link>
          <Link href="/dashboard/reviews" className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 text-sm min-h-[44px]">
            <i className="fa-solid fa-comment-dots" /> {t("dashboard.moderateReviews")}
          </Link>
        </div>
      </section>
    </div>
  );
}
