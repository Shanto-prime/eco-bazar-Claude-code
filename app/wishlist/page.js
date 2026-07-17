"use client";

// app/wishlist/page.js — Saved items. Reads slugs from CartContext.

import Link from "next/link";
import Breadcrumb from "../../components/Breadcrumb";
import ProductCard from "../../components/ProductCard";
import { useCart } from "../../lib/CartContext";
import { products } from "../../lib/data";
import { useT } from "../../lib/i18n/LanguageProvider";

export default function WishlistPage() {
  const t = useT();
  const { wishlist, hydrated, toggleWishlist, addItem } = useCart();
  if (!hydrated) return null;

  const items = products.filter((p) => wishlist.includes(p.slug));

  return (
    <>
      <Breadcrumb items={[{ label: t("wishlist.breadcrumb") }]} />
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">{t("wishlist.heading")}</h1>

        {items.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <div className="text-6xl sm:text-7xl mb-4">💚</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{t("wishlist.empty")}</h2>
            <p className="text-gray-500 mb-6">{t("wishlist.emptySub")}</p>
            <Link href="/shop" className="inline-block px-6 py-3 rounded-full bg-eco-green text-white font-medium min-h-[44px]">
              {t("wishlist.browseProducts")}
            </Link>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-4">{t(items.length === 1 ? "wishlist.savedItems_one" : "wishlist.savedItems_other", { count: items.length })}</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {items.map((p) => (
                <div key={p.slug} className="relative">
                  <ProductCard {...p} />
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => addItem(p, 1)}
                      className="flex-1 py-2 rounded-full bg-eco-green text-white text-xs font-medium min-h-[36px]"
                    >{t("wishlist.moveToCart")}</button>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(p.slug, p.name)}
                      className="px-3 py-2 rounded-full border text-xs hover:border-red-500 hover:text-red-500 min-h-[36px]"
                      aria-label={t("wishlist.remove", { name: p.name })}
                    ><i className="fa-solid fa-trash" /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
