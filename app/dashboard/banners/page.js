// app/dashboard/banners/page.js — ADMIN only.
// Manage the storefront promo banners (top announcement, below-list ad, hot
// deals). Each is an uploaded image linking to /deals/<slug>, which lists the
// products the promo applies to. See lib/banners.js + the storefront
// <PromoBanners> component.

import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { getT } from "../../../lib/i18n/server";
import BannersManager from "./_components/BannersManager";

export default async function DashboardBanners() {
  const { t } = await getT();
  await requireRole("ADMIN", "/dashboard/banners");

  const banners = await prisma.promoBanner.findMany({
    orderBy: [{ placement: "asc" }, { sort: "asc" }, { createdAt: "desc" }],
  });

  const rows = banners.map((b) => ({
    id: b.id,
    title: b.title,
    imageUrl: b.imageUrl,
    placement: b.placement,
    slug: b.slug,
    promoCode: b.promoCode,
    targetTag: b.targetTag,
    active: b.active,
    sort: b.sort,
    deadline: b.deadline ? b.deadline.toISOString() : null,
  }));

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t("banners.title")}</h1>
        <p className="mt-1.5 text-sm text-gray-500">{t("banners.subtitle")}</p>
      </header>

      <BannersManager banners={rows} />
    </div>
  );
}
