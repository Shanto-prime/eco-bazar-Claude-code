"use client";

// app/shop/ShopClient.jsx — Shop with live filtering, sort, search, pagination.
// Responsive: sidebar collapses behind a "Filters" button on mobile.
// Rendered inside a <Suspense> boundary by app/shop/page.js because it calls
// useSearchParams() (required by Next for static-generation bailout).

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Breadcrumb from "../../components/Breadcrumb";
import ProductCard from "../../components/ProductCard";
import { products } from "../../lib/data";

const PER_PAGE = 9;

export default function ShopClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [query, setQuery]   = useState(sp.get("q") || "");
  const [tag, setTag]       = useState(null);
  const [minPrice, setMin]  = useState(0);
  const [maxPrice, setMax]  = useState(100);
  const [minRating, setRating] = useState(0);
  const [sort, setSort]     = useState("latest");
  const [page, setPage]     = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { setQuery(sp.get("q") || ""); }, [sp]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
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
  }, [query, minPrice, maxPrice, minRating, sort]);

  useEffect(() => { setPage(1); }, [query, minPrice, maxPrice, minRating, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const url = query.trim() ? `/shop?q=${encodeURIComponent(query.trim())}` : "/shop";
    router.replace(url);
  };

  const resetAll = () => {
    setQuery(""); setMin(0); setMax(100); setRating(0); setSort("latest"); setTag(null);
    router.replace("/shop");
  };

  const sidebar = (
    <div className="space-y-8">
      <form onSubmit={onSearchSubmit} className="relative">
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..." className="eco-input pr-10 rounded-full"
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-eco-green" aria-label="Search">
          <i className="fa-solid fa-magnifying-glass" />
        </button>
      </form>

      <div>
        <div className="font-semibold mb-3">Price range</div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>${minPrice}</span>
          <input type="range" min={0} max={100} value={maxPrice} onChange={(e) => setMax(Number(e.target.value))} className="price-range flex-1" />
          <span>{maxPrice === 100 ? "Any" : `$${maxPrice}`}</span>
        </div>
      </div>

      <div>
        <div className="font-semibold mb-3">Rating</div>
        <ul className="space-y-1 text-sm">
          {[5, 4, 3, 2, 1, 0].map((n) => (
            <li key={n}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="r" className="eco-check" checked={minRating === n} onChange={() => setRating(n)} />
                {n === 0 ? (
                  <span className="text-gray-500">Any rating</span>
                ) : (
                  <>
                    <span className="text-yellow-400">{"★".repeat(n)}<span className="text-gray-300">{"★".repeat(5 - n)}</span></span>
                    <span className="text-gray-500">{n}.0 {n < 5 && "& up"}</span>
                  </>
                )}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="font-semibold mb-3">Popular Tags</div>
        <div className="flex flex-wrap gap-2 text-xs">
          {["Healthy","Low fat","Vegetarian","Vitamins","Bread","Meat","Snacks"].map((t) => (
            <button
              type="button" key={t} onClick={() => setTag(tag === t ? null : t)}
              className={`px-3 py-1 border rounded-full transition ${tag === t ? "bg-eco-green text-white border-transparent" : "hover:border-eco-green"}`}
            >{t}</button>
          ))}
        </div>
      </div>

      <button type="button" onClick={resetAll} className="text-sm text-gray-500 hover:text-eco-green underline">Reset all filters</button>
    </div>
  );

  return (
    <>
      <Breadcrumb items={[{ label: "Shop" }]} />

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block lg:col-span-3">{sidebar}</aside>

        <div className="lg:col-span-9">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="text-sm text-gray-500">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-sm">
              <button
                type="button" onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 border rounded px-3 py-2 hover:border-eco-green"
              ><i className="fa-solid fa-sliders" /> Filters</button>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded px-3 py-2">
                <option value="latest">Latest</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>

          {pageItems.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-lg p-10 text-center text-gray-500">
              <div className="text-5xl mb-3">🤷</div>
              No products match your filters.
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
                className="w-9 h-9 rounded-full border hover:border-eco-green" aria-label="Next page">
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
              <div className="font-semibold">Filters</div>
              <button type="button" onClick={() => setShowFilters(false)} className="w-9 h-9 grid place-items-center" aria-label="Close filters">
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{sidebar}</div>
            <div className="border-t p-4">
              <button type="button" onClick={() => setShowFilters(false)} className="w-full py-3 rounded-full bg-eco-green text-white font-medium">
                Show {filtered.length} results
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
