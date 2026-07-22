"use client";

// app/shop/ShopClient.jsx — Shop with live filtering, sort, search, and
// SERVER-SIDE pagination. Only the current page (9 products) is ever held in
// memory: the server renders page 1, and every filter/sort/page change fetches
// just that page from /api/products. This keeps the initial payload small and
// avoids loading the entire catalogue up front.
//
// Two search modes:
//   1. by product NAME  — the search box
//   2. by CATEGORY      — the Categories list in the sidebar (and the homepage
//      tiles that deep-link to /shop?cat=<slug>, seeded server-side on entry)

import { useEffect, useRef, useState } from "react";
import Breadcrumb from "../../components/Breadcrumb";
import ProductCard from "../../components/ProductCard";
import { useT } from "../../lib/i18n/LanguageProvider";

const PER_PAGE = 9;

export default function ShopClient({ initial, initialQ = "", initialCat = "", categories = [] }) {
  const t = useT();

  // Filters.
  const [query, setQuery]      = useState(initialQ);
  const [activeCat, setCat]    = useState(initialCat || null);
  const [minPrice]             = useState(0); // lower bound is fixed at 0 in the UI
  const [maxPrice, setMax]     = useState(100);
  const [minRating, setRating] = useState(0);
  const [sort, setSort]        = useState("latest");
  const [page, setPage]        = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Server-provided page + status.
  const [items, setItems]   = useState(initial?.items || []);
  const [total, setTotal]   = useState(initial?.total || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(false);

  const activeCatName = activeCat
    ? categories.find((c) => c.slug === activeCat)?.name || activeCat
    : null;

  // Reset to page 1 whenever a non-page filter changes.
  useEffect(() => { setPage(1); }, [query, activeCat, maxPrice, minRating, sort]);

  // Fetch the current page from the API whenever filters or page change.
  // The first render is seeded by the server (props), so we skip it. A request
  // id guards against out-of-order responses overwriting newer results.
  const first = useRef(true);
  const reqId = useRef(0);
  useEffect(() => {
    if (first.current) { first.current = false; return; }

    const id = setTimeout(async () => {
      const mine = ++reqId.current;
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams();
        if (query.trim())   params.set("q", query.trim());
        if (activeCat)      params.set("cat", activeCat);
        if (minPrice > 0)   params.set("minPrice", String(minPrice));
        if (maxPrice < 100) params.set("maxPrice", String(maxPrice));
        if (minRating > 0)  params.set("minRating", String(minRating));
        if (sort !== "latest") params.set("sort", sort);
        params.set("page", String(page));
        params.set("perPage", String(PER_PAGE));

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("bad status");
        const data = await res.json();
        if (mine !== reqId.current) return; // a newer request superseded this one
        setItems(data.items || []);
        setTotal(data.total || 0);
      } catch {
        if (mine !== reqId.current) return;
        setError(true);
        setItems([]);
        setTotal(0);
      } finally {
        if (mine === reqId.current) setLoading(false);
      }
    }, 250); // debounce rapid changes (typing, slider drag)

    return () => clearTimeout(id);
  }, [query, activeCat, minPrice, maxPrice, minRating, sort, page]);

  const selectCategory = (slug) => {
    // Toggle: clicking the active category again clears it.
    setCat((cur) => (cur === slug ? null : slug));
    setShowFilters(false);
  };

  const resetAll = () => {
    setQuery(""); setMax(100); setRating(0); setSort("latest"); setCat(null);
  };

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const showingFrom = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const showingTo   = Math.min(page * PER_PAGE, total);

  const sidebar = (
    <div className="space-y-8">
      <form onSubmit={(e) => e.preventDefault()} className="relative">
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
                onClick={() => { setCat(null); setShowFilters(false); }}
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
                <button type="button" onClick={() => setCat(null)} aria-label={t("shop.clearCategory")}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="text-sm text-gray-500">
              {t("shop.showing", { from: showingFrom, to: showingTo, total })}
              {loading && <span className="ml-2 text-eco-green">{t("common.loading")}</span>}
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

          {error ? (
            <div className="border border-dashed border-red-200 rounded-lg p-10 text-center text-red-500">
              <div className="text-5xl mb-3">⚠️</div>
              {t("shop.loadError")}
            </div>
          ) : items.length === 0 && !loading ? (
            <div className="border border-dashed border-gray-200 rounded-lg p-10 text-center text-gray-500">
              <div className="text-5xl mb-3">🤷</div>
              {t("shop.noMatch")}
            </div>
          ) : (
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 transition-opacity ${loading ? "opacity-60" : ""}`}>
              {items.map((p) => <ProductCard key={p.slug} {...p} />)}
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
                {t("shop.showResults", { count: total })}
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
