// app/page.js — Homepage. Fully responsive: section paddings, type scale, and
// grid breakpoints all collapse cleanly on mobile.
import Image from "next/image";
import Link from "next/link";
import ProductCard from "../components/ProductCard";
import CategoryTile from "../components/CategoryTile";
import NewsCard from "../components/NewsCard";
import TestimonialsSection from "../components/TestimonialsSection";
import HomeHotDealsCard from "../components/HomeHotDealsCard";
import { categories, news, instagramTiles } from "../lib/data";
import { listProducts } from "../lib/products-db";
import { getT } from "../lib/i18n/server";

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
  const { locale, t } = await getT();
  const viewAll = t("common.viewAll");
  // Products come from the database (so admin/moderator additions show up),
  // localized to the active language.
  const products = await listProducts({ take: 30, locale });

  return (
    <>
      {/* ============ HERO  =========================================== */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-4 sm:mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-8 rounded-xl overflow-hidden relative aspect-[16/11]">
            <Image src="/images/hero-main.jpg" alt="Fresh & Healthy Organic Food" fill className="object-cover" priority sizes="(min-width:1024px) 66vw, 100vw" />
          </div>
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
            <div className="rounded-xl overflow-hidden relative aspect-[3/2]">
              <Image src="/images/hero-summer.jpg" alt="Summer Sale 75% Off" fill className="object-cover" sizes="(min-width:1024px) 33vw, 50vw" />
            </div>
            <div className="rounded-xl overflow-hidden relative aspect-[3/2]">
              <Image src="/images/hero-special.jpg" alt="Special Products Deal of the Month" fill className="object-cover" sizes="(min-width:1024px) 33vw, 50vw" />
            </div>
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
          {products.map((p) => <ProductCard key={p.slug} {...p} />)}
        </div>
      </section>

      {/* ============ SALE OF THE MONTH =============================== */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-10 sm:mt-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {["sale-month1.jpg","sale-month2.jpg","sale-month3.jpg"].map((f) => (
            <div key={f} className="rounded-xl overflow-hidden relative aspect-[3/2]">
              <Image src={`/images/${f}`} alt="" fill className="object-cover" sizes="(min-width:768px) 33vw, 100vw" />
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOT DEALS  ====================================== */}
      <section className="bg-eco-bg py-10 sm:py-14 mt-10 sm:mt-14">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
          <SectionHead title={t("home.hotDeals")} href="/shop" viewAllText={viewAll} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            <div className="lg:col-span-4">
              <HomeHotDealsCard />
            </div>
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
              {products.slice(2, 10).map((p) => (
                <ProductCard key={p.slug + "-deal"} {...p} size="sm" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 37% OFF BANNER ================================== */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-10 sm:mt-14">
        <div className="rounded-xl overflow-hidden relative aspect-[1620/440]">
          <Image src="/images/banner-37off.jpg" alt="Summer Sale 37% Off" fill className="object-cover" sizes="100vw" />
        </div>
      </section>

      {/* ============ FEATURED PRODUCTS =============================== */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-10 sm:mt-14">
        <SectionHead title={t("home.featuredProducts")} href="/shop" viewAllText={viewAll} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
          {products.slice(0, 5).map((p) => <ProductCard key={p.slug + "-feat"} {...p} />)}
        </div>
      </section>

      {/* ============ LATEST NEWS ===================================== */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-10 sm:mt-14">
        <SectionHead title={t("home.latestNews")} center />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {news.map((n) => <NewsCard key={n.id} {...n} />)}
        </div>
      </section>

      {/* ============ TESTIMONIALS ==================================== */}
      <TestimonialsSection />

      {/* ============ BRAND STRIP ===================================== */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 my-10 sm:my-12">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6 items-center text-gray-300 text-base sm:text-xl font-bold">
          <div className="text-eco-green italic text-xl sm:text-2xl">steps</div>
          <div className="text-center">MANGO</div>
          <div className="text-center italic">food</div>
          <div className="text-center">FOOD</div>
          <div className="text-center">BOOK-OFF</div>
          <div className="text-center">G Series</div>
        </div>
      </section>

      {/* ============ INSTAGRAM ======================================= */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-10 sm:mt-14 mb-10 sm:mb-14">
        <SectionHead title={t("home.followInstagram")} center />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {instagramTiles.map((src, i) => (
            <a key={i} href="#" className="block rounded-md overflow-hidden relative aspect-square">
              <Image src={src} alt="" fill className="object-cover" sizes="(min-width:1024px) 16vw, (min-width:640px) 33vw, 50vw" />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
