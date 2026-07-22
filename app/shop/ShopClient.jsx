"use client";

// app/shop/ShopClient.jsx — Shop with live filtering, sort, search, pagination.
// Two search modes:
//   1. by product NAME  — the search box (also drives /shop?q=…)
//   2. by CATEGORY      — the Categories list in the sidebar, and the homepage
//      category tiles that link to /shop?cat=<slug>. Selecting a category shows
//      ONLY that category's products.
// Responsive: sidebar collapses behind a "Filters" button on mobile.

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Breadcrumb from "../../components/Breadcrumb";
import ProductCard from "../../components/ProductCard";
import { useT } from "../../lib/i18n/LanguageProvider";

const PER_PAGE = 9;

// Build a /shop URL from the active filters that belong in the URL (name query +
// category), so both are shareable/bookmarkable and survive a reload.
function buildShopUrl({ q, cat }) {
  const usp = new URLSearchParams();
  if (q)   usp.set("q", q);
  if (cat) usp.set("cat", cat);
  const s = usp.toString();
  return s ? `/shop?${s}` : "/shop";
}

export default function ShopClient({ products = [] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useT();

  const [query, setQuery]   = useState(sp.get("q") || "");
  const [minPrice, setMin]  = useState(0);
  const [maxPrice, setMax]  = useState(100);
  const [minRating, setRating] = useState(0);
  const [sort, setSort]     = useState("latest");
  const [page, setPage]     = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Category is driven by the URL (?cat=…) so tiles, the sidebar, and deep links
  // all agree. null = all categories.
  const activeCat = sp.get("cat") || null;

  useEffect(() => { setQuery(sp.get("q") || ""); }, [sp]);

  // Distinct categories present in the catalogue, for the sidebar list.
  const categories = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      if (p.categorySlug && !map.has(p.categorySlug)) map.set(p.categorySlug, p.categoryName || p.categorySlug);
    }
    return [...map.entries()]
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const activeCatName = activeCat
    ? categories.find((c) => c.slug === activeCat)?.name || activeCat
    : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      // Category search: hard filter to the selected category.
      if (activeCat && p.categorySlug !== activeCat) return false;
      // Name search.
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (p.price < minPrice) return false;
      if (p.price > maxPrice && maxPrice < 100) return false;
      if ((p.rating ?? 0) < minRating) return false;
      return true;
    });
    if (sort === "price-asc")  list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name")       list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, query, activeCat, minPrice, maxPrice, minRating, sort]);

  useEffect(() => { setPage(1); }, [query, activeCat, minPrice, maxPrice, minRating, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    router.replace(buildShopUrl({ q: query.trim(), cat: activeCat }));
  };

  const selectCategory = (slug) => {
    // Toggle: clicking the active category again clears it.
    const nextCat = activeCat === slug ? null : slug;
    router.replace(buildShopUrl({ q: query.trim(), cat: nextCat }));
    setShowFilters(false);
  };

  const resetAll = () => {
    setQuery(""); setMin(0); setMax(100); setRating(0); setSort("latest");
    router.replace("/shop");
  };

  const sidebar = (
    <div className="space-y-8">
      <form onSubmit={onSearchSubmit} className="relative">
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={t("common.searchProducts")} className="eco-input pr-10 rounded-full"
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-green" aria-label={t("common.search")}>
          <i className="fa-solid fa-magnifying-glass" />
        </button>
      </form>

      {/* Category search */}
      {categories.length > 0 && (
        <div>
          <div className="font-semibold mb-3">{t("shop.categories")}</div>
          <ul className="space-y-1 text-sm">
            <li>
              <button
                type="button"
                onClick={() => { router.replace(buildShopUrl({ q: query.trim(), cat: null })); setShowFilters(false); }}
                className={`w-full text-left px-2 py-1.5 rounded transition ${!activeCat ? "bg-eco-green/10 text-eco-green font-medium" : "text-gray-600 hover:text-eco-green"}`}
              >
                {t("shop.allCategories")}
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <button
                  type="button"
                  onClick={() => selectCategory(c.slug)}
                  aria-pressed={activeCat === c.slug}
                  className={`w-full text-left px-2 py-1.5 rounded transition ${activeCat === c.slug ? "bg-eco-green/10 text-eco-green font-medium" : "text-gray-600 hover:text-eco-green"}`}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="font-semibold mb-3">{t("shop.priceRange")}</div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>${minPrice}</span>
          <input type="range" min={0} max={100} value={maxPrice} onChange={(e) => setMax(Number(e.target.value))} className="price-range flex-1" />
          <span>{maxPrice === 100 ? t("shop.any") : `$${maxPrice}`}</span>
        </div>
      </div>

      <div>
        <div className="font-semibold mb-3">{t("shop.rating")}</div>
        <ul className="space-y-1 text-sm">
          {[5, 4, 3, 2, 1, 0].map((n) => (
            <li key={n}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="r" className="eco-check" checked={minRating === n} onChange={() => setRating(n)} />
                {n === 0 ? (
                  <span className="text-gray-500">{t("shop.anyRating")}</span>
                ) : (
                  <>
                    <span className="text-yellow-400">{"★".repeat(n)}<span className="text-gray-300">{"★".repeat(5 - n)}</span></span>
                    <span className="text-gray-500">{n}.0 {n < 5 && t("shop.andUp")}</span>
                  </>
                )}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <button type="button" onClick={resetAll} className="text-sm text-gray-500 hover:text-eco-green underline">{t("shop.resetFilters")}</button>
    </div>
  );

  return (
    <>
      <Breadcrumb items={activeCatName ? [{ href: "/shop", label: t("shop.title") }, { label: activeCatName }] : [{ label: t("shop.title") }]} />

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block lg:col-span-3">{sidebar}</aside>

        <div className="lg:col-span-9">
          {/* Active category banner */}
          {activeCatName && (
            <div className="mb-4 flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-eco-green/10 text-eco-green px-3 py-1 font-medium">
                {t("shop.categoryLabel")} {activeCatName}
                <button type="button" onClick={() => router.replace(buildShopUrl({ q: query.trim(), cat: null }))} aria-label={t("shop.clearCategory")}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="text-sm text-gray-500">
              {t("shop.showing", {
                from: filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1,
                to: Math.min(page * PER_PAGE, filtered.length),
                total: filtered.length,
              })}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-sm">
              <button
                type="button" onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 border rounded px-3 py-2 hover:border-eco-green"
              ><i className="fa-solid fa-sliders" /> {t("shop.filters")}</button>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded px-3 py-2">
                <option value="latest">{t("shop.sortLatest")}</option>
                <option value="price-asc">{t("shop.sortPriceAsc")}</option>
                <option value="price-desc">{t("shop.sortPriceDesc")}</option>
                <option value="name">{t("shop.sortName")}</option>
              </select>
            </div>
          </div>

          {pageItems.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-lg p-10 text-center text-gray-500">
              <div className="text-5xl mb-3">🤷</div>
              {t("shop.noMatch")}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
              {pageItems.map((p) => <ProductCard key={p.slug} {...p} />)}
            </div>
          )}

          {pageCount > 1 && (
            <div className="flex justify-center mt-8 sm:mt-10 gap-2 flex-wrap">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button key={i} type="button" onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-full ${page === i + 1 ? "bg-eco-green text-white" : "border hover:border-eco-green"}`}
                >{i + 1}</button>
              ))}
              <button type="button" onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="w-9 h-9 rounded-full border hover:border-eco-green" aria-label={t("shop.nextPage")}>
                <i className="fa-solid fa-arrow-right text-xs" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Mobile filter drawer */}
      {showFilters && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowFilters(false)} />
          <aside className="fixed top-0 right-0 bottom-0 w-80 max-w-[88vw] bg-white z-50 lg:hidden flex flex-col animate-[slideInRight_.2s_ease-out]">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="font-semibold">{t("shop.filters")}</div>
              <button type="button" onClick={() => setShowFilters(false)} className="w-9 h-9 grid place-items-center" aria-label={t("shop.closeFilters")}>
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{sidebar}</div>
            <div className="border-t p-4">
              <button type="button" onClick={() => setShowFilters(false)} className="w-full py-3 rounded-full bg-eco-green text-white font-medium">
                {t("shop.showResults", { count: filtered.length })}
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
