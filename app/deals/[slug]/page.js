// app/deals/[slug]/page.js — the promo landing page a banner links to.
//
// Resolves the banner by slug, then shows ONLY the products the promo applies to
// (matched by targetTag against each product's badge/tags — see
// lib/products-db listProductsByTag). A hidden (inactive) banner 404s; an
// expired one (active but past its deadline) still renders, flagged as expired.

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { listProductsByTag } from "../../../lib/products-db";
import { getT } from "../../../lib/i18n/server";
import { isExpired } from "../../../lib/banners";
import Breadcrumb from "../../../components/Breadcrumb";
import ProductCard from "../../../components/ProductCard";
import CopyCode from "./_components/CopyCode";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { t } = await getT();
  const banner = await prisma.promoBanner.findUnique({ where: { slug } });
  return { title: banner ? `${banner.title} — Ecobazar` : t("deals.notFoundTitle") };
}

export default async function DealPage({ params }) {
  const { slug } = await params;
  const { t } = await getT();

  const banner = await prisma.promoBanner.findUnique({ where: { slug } });
  // Missing or hidden → not found (customers can't reach a switched-off deal).
  if (!banner || !banner.active) notFound();

  const [products] = await Promise.all([listProductsByTag(banner.targetTag)]);
  const expired = isExpired(banner.deadline);

  return (
    <>
      <Breadcrumb items={[{ href: "/shop", label: t("deals.breadcrumb") }, { label: banner.title }]} />

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Banner artwork */}
        <div className="rounded-2xl overflow-hidden border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner.imageUrl} alt={banner.title} className="w-full h-auto object-cover" />
        </div>

        {/* Promo meta: code, deadline, applicability */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold mr-auto">{banner.title}</h1>

          {banner.promoCode && !expired && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{t("deals.useCode")}</span>
              <CopyCode code={banner.promoCode} />
            </div>
          )}

          {banner.deadline && (
            expired ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-sm font-medium">
                <i className="fa-solid fa-clock" /> {t("deals.expired")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-eco-green/10 text-eco-green px-3 py-1 text-sm font-medium">
                <i className="fa-regular fa-clock" /> {t("deals.endsOn", { date: new Date(banner.deadline).toLocaleString() })}
              </span>
            )
          )}
        </div>

        <p className="mt-2 text-sm text-gray-500">
          {t("deals.applicableTo", { count: products.length })}
        </p>

        {/* Applicable products only */}
        {products.length === 0 ? (
          <div className="mt-6 border border-dashed border-gray-200 rounded-lg p-10 text-center text-gray-500">
            <div className="text-5xl mb-3">🏷️</div>
            {t("deals.noProducts")}{" "}
            <Link href="/shop" className="text-eco-green underline">{t("deals.browseShop")}</Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
            {products.map((p) => <ProductCard key={p.slug} {...p} />)}
          </div>
        )}
      </section>
    </>
  );
}
