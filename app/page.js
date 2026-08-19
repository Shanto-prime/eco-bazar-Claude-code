// app/page.js — Homepage. Fully responsive: section paddings, type scale, and
// grid breakpoints all collapse cleanly on mobile.
import Image from "next/image";
import Link from "next/link";
import ProductCard from "../components/ProductCard";
import CategoryTile from "../components/CategoryTile";
import TestimonialsSection from "../components/TestimonialsSection";
import HomeHotDealsCard from "../components/HomeHotDealsCard";
import PromoBanners from "../components/PromoBanners";
import { categories } from "../lib/data";
import { listProducts, listBestSellers, listLiveOffers } from "../lib/products-db";
import { getT } from "../lib/i18n/server";
import { HOT_DEALS_TOTAL_SLOTS } from "../lib/offers";
import { prisma } from "../lib/prisma";
import { isBannerLive, dealsHref } from "../lib/banners";

// Reusable section heading shared across the homepage.
function SectionHead({ title, href, center, viewAllText = "View All" }) {
  if (center) return <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">{title}</h2>;
  return (
    <div className="flex justify-between items-end mb-5 sm:mb-6 gap-4">
      <h2 className="text-2xl sm:text-3xl font-bold">{title}</h2>
      {href && (
        <Link href={href} className="text-eco-green font-medium text-sm sm:text-base whitespace-nowrap">
          {viewAllText} <i className="fa-solid fa-arrow-right text-xs" />
        </Link>
      )}
    </div>
  );
}

export default async function Home() {
  const { t } = await getT();
  const viewAll = t("common.viewAll");
  // Products come from the database (so admin/moderator additions show up).
  const products = await listProducts({ take: 30 });
  // Popular Products shows the best-selling items (falls back to on-sale, then
  // latest). Two rows on desktop (10 items); the rest live on the shop page.
  const popular = await listBestSellers(10);

  // ---- Hot Deals area ----------------------------------------------------
  // Live offers, soonest-ending first (see lib/products-db listLiveOffers). The
  // first one takes the big featured card; the rest become small cards.
  const liveOffers = await listLiveOffers(HOT_DEALS_TOTAL_SLOTS);
  const [featuredDeal, ...otherDeals] = liveOffers;

  // Fill whatever the offers don't claim with ordinary products, so the grid
  // stays a full 2×4 block instead of collapsing to one or two lonely cards.
  // Products already shown as offers are excluded to avoid duplicates.
  const dealSlugs = new Set(liveOffers.map((p) => p.slug));
  const fillerCount = Math.max(0, HOT_DEALS_TOTAL_SLOTS - 1 - otherDeals.length);
  const hotDealsGrid = [
    ...otherDeals,
    ...products.filter((p) => !dealSlugs.has(p.slug)).slice(0, fillerCount),
  ];

  // Top-right hero slot: if there's a live TOP promo banner, it takes over the
  // slot as a clickable image linking to its /deals/<slug> landing page. When
  // there isn't one, the static `hero-summer.jpg` shows through as a fallback.
  // Only the FIRST live TOP banner is used here; additional TOP banners are not
  // rendered anywhere else on the homepage (the previous PromoBanners strip
  // below the hero was removed).
  const heroTopBannerRow = await prisma.promoBanner.findFirst({
    where:   { placement: "TOP", active: true },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
  });
  const heroTopBanner = heroTopBannerRow && isBannerLive(heroTopBannerRow) ? heroTopBannerRow : null;

  return (
    <>
      {/* ============ HERO  =========================================== */}
      {/* Each hero card is a link. The "Shop now" button visible in the JPGs is
          part of the artwork itself — clicking it works because the whole card
          is the click target. Left card → /shop (the organic-food catalogue);
          top-right → the live TOP promo banner's /deals/<slug> (falls back to a
          static image with no link when no banner is live); bottom-right → the
          Hot Deals section further down this same page. */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-4 sm:mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <Link href="/shop" aria-label={t("home.heroAlt")} className="lg:col-span-8 rounded-xl overflow-hidden relative aspect-[16/11] block hover:opacity-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-green">
            <Image src="/images/hero-main.jpg" alt={t("home.heroAlt")} fill className="object-cover" priority sizes="(min-width:1024px) 66vw, 100vw" />
          </Link>
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
            <div className="rounded-xl overflow-hidden relative aspect-[3/2]">
              {heroTopBanner ? (
                <Link href={dealsHref(heroTopBanner.slug)} aria-label={heroTopBanner.title} className="block absolute inset-0 hover:opacity-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-green">
                  {/* Uploaded banner files (Vercel Blob or /uploads/banners) aren't in
                      next.config images.remotePatterns for arbitrary hosts, so use a
                      plain <img> for consistency with components/PromoBanners.jsx. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroTopBanner.imageUrl} alt={heroTopBanner.title} className="absolute inset-0 w-full h-full object-cover" />
                </Link>
              ) : (
                <Image src="/images/hero-summer.jpg" alt={t("home.summerSale75Alt")} fill className="object-cover" sizes="(min-width:1024px) 33vw, 50vw" />
              )}
            </div>
            <Link href="/#hot-deals" aria-label={t("home.dealOfMonthAlt")} className="rounded-xl overflow-hidden relative aspect-[3/2] block hover:opacity-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-green">
              <Image src="/images/hero-special.jpg" alt={t("home.dealOfMonthAlt")} fill className="object-cover" sizes="(min-width:1024px) 33vw, 50vw" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ SERVICE BAR ===================================== */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
        <div className="border border-gray-200 rounded-xl px-4 sm:px-8 py-5 sm:py-6 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { icon: "fa-truck",          title: t("home.freeShipping"),   sub: t("home.freeShippingSub") },
            { icon: "fa-headset",        title: t("home.support"),        sub: t("home.supportSub") },
            { icon: "fa-shield-halved",  title: t("home.securePayment"),  sub: t("home.securePaymentSub") },
            { icon: "fa-box",            title: t("home.moneyBack"),      sub: t("home.moneyBackSub") },
          ].map((s) => (
            <div key={s.title} className="flex items-center gap-3 sm:gap-4">
              <i className={`fa-solid ${s.icon} text-2xl sm:text-3xl text-eco-green`} />
              <div>
                <div className="font-semibold text-sm sm:text-base">{s.title}</div>
                <div className="text-[11px] sm:text-xs text-gray-500">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ POPULAR CATEGORIES ============================== */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-10 sm:mt-14">
        <SectionHead title={t("home.popularCategories")} href="/shop" viewAllText={viewAll} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
          {categories.map((c) => <CategoryTile key={c.slug} {...c} />)}
        </div>
      </section>

      {/* ============ POPULAR PRODUCTS ================================ */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-10 sm:mt-14">
        <SectionHead title={t("home.popularProducts")} href="/shop" viewAllText={viewAll} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
          {popular.map((p) => <ProductCard key={p.slug} {...p} />)}
        </div>
        {/* The two rows above are the top sellers; everything else lives on the
            shop page, loaded a page at a time. */}
        <div className="flex justify-center mt-6 sm:mt-8">
          <Link
            href="/shop"
            className="inline-block px-8 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600 transition min-h-[44px]"
          >
            {t("home.seeMoreProducts")}
          </Link>
        </div>
      </section>

      {/* ============ HOT DEALS  ====================================== */}
      {/* id="hot-deals" is the anchor target for the bottom-right hero card. */}
      <section id="hot-deals" className="bg-eco-bg py-10 sm:py-14 mt-10 sm:mt-14 scroll-mt-20">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
          <SectionHead title={t("home.hotDeals")} href="/shop" viewAllText={viewAll} />
          {/* The big featured card exists only while an offer is running. With no
              live offer the left column is dropped entirely and the small grid
              takes the full width, rather than leaving a placeholder card. */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            {featuredDeal && (
              <div className="lg:col-span-4">
                <HomeHotDealsCard product={featuredDeal} />
              </div>
            )}
            <div className={`${featuredDeal ? "lg:col-span-8" : "lg:col-span-12"} grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5`}>
              {hotDealsGrid.map((p) => (
                <ProductCard key={p.slug + "-deal"} {...p} size="sm" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ AD BELOW PRODUCT LIST (admin-managed) ========== */}
      {/* Replaces the old hardcoded 37%-off image; falls back to nothing when
          no banner is set. */}
      <PromoBanners
        placement="BELOW_LIST"
        className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-10 sm:mt-14 space-y-4 sm:space-y-5"
      />

      {/* ============ FEATURED PRODUCTS =============================== */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-10 sm:mt-14">
        <SectionHead title={t("home.featuredProducts")} href="/shop" viewAllText={viewAll} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
          {products.slice(0, 5).map((p) => <ProductCard key={p.slug + "-feat"} {...p} />)}
        </div>
      </section>

      {/* ============ CUSTOMER REVIEWS =============================== */}
      <TestimonialsSection />
    </>
  );
}
