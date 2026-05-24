"use client";

// components/Header.jsx — logo / search / wishlist / cart row.
// Responsive: on mobile, the search bar collapses below the logo+icons row.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "../lib/CartContext";

export default function Header() {
  const { itemCount, total, wishlist, hydrated } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
    setSearchOpen(false);
  };

  return (
    <header className="border-b border-gray-100 sticky top-0 bg-white z-30">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-4 sm:gap-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <i className="fa-solid fa-seedling text-eco-green text-2xl sm:text-3xl" />
          <span className="text-xl sm:text-2xl font-bold text-eco-dark">Ecobazar</span>
        </Link>

        {/* Desktop / tablet search bar */}
        <form className="hidden md:block flex-1 max-w-[600px]" onSubmit={onSearch}>
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-28 py-3 border border-gray-200 rounded-md focus:outline-none focus:border-eco-green"
            />
            <button type="submit" className="absolute right-1 top-1 bottom-1 px-6 bg-eco-green text-white font-medium rounded">Search</button>
          </div>
        </form>

        <div className="flex items-center gap-3 sm:gap-6 ml-auto">
          <button
            type="button" onClick={() => setSearchOpen((s) => !s)}
            className="md:hidden w-10 h-10 grid place-items-center"
            aria-label="Search"
          ><i className="fa-solid fa-magnifying-glass text-xl" /></button>

          <Link href="/wishlist" className="relative" aria-label="Wishlist">
            <i className="fa-regular fa-heart text-xl sm:text-2xl" />
            {hydrated && wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-eco-green text-white text-[10px] w-4 h-4 rounded-full grid place-items-center">{wishlist.length}</span>
            )}
          </Link>

          <div className="h-8 w-px bg-gray-200 hidden sm:block" />

          <Link href="/cart" className="flex items-center gap-2 sm:gap-3" aria-label="Cart">
            <div className="relative">
              <i className="fa-solid fa-bag-shopping text-xl sm:text-2xl" />
              {hydrated && itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-eco-green text-white text-[10px] w-4 h-4 rounded-full grid place-items-center">{itemCount}</span>
              )}
            </div>
            <div className="hidden sm:block text-xs leading-tight">
              <div className="text-gray-500">Shopping cart:</div>
              <div className="font-semibold">${hydrated ? total.toFixed(2) : "0.00"}</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Mobile search drawer */}
      {searchOpen && (
        <form onSubmit={onSearch} className="md:hidden px-4 pb-3 -mt-1">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="search" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-20 py-3 border border-gray-200 rounded-md focus:outline-none focus:border-eco-green"
            />
            <button type="submit" className="absolute right-1 top-1 bottom-1 px-4 bg-eco-green text-white font-medium rounded text-sm">Search</button>
          </div>
        </form>
      )}
    </header>
  );
}
