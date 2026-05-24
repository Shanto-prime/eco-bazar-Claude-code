"use client";

// app/wishlist/page.js — Saved items. Reads slugs from CartContext.

import Link from "next/link";
import Breadcrumb from "../../components/Breadcrumb";
import ProductCard from "../../components/ProductCard";
import { useCart } from "../../lib/CartContext";
import { products } from "../../lib/data";

export default function WishlistPage() {
  const { wishlist, hydrated, toggleWishlist, addItem } = useCart();
  if (!hydrated) return null;

  const items = products.filter((p) => wishlist.includes(p.slug));

  return (
    <>
      <Breadcrumb items={[{ label: "Wishlist" }]} />
      <section className="max-w-[1320px] mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-center mb-8">My Wishlist</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-7xl mb-4">💚</div>
            <h2 className="text-2xl font-bold mb-2">No saved items yet</h2>
            <p className="text-gray-500 mb-6">Tap the heart icon on any product to save it here.</p>
            <Link href="/shop" className="inline-block px-6 py-3 rounded-full bg-eco-green text-white font-medium">
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-4">{items.length} saved item{items.length === 1 ? "" : "s"}</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {items.map((p) => (
                <div key={p.slug} className="relative">
                  <ProductCard {...p} />
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => addItem(p, 1)}
                      className="flex-1 py-2 rounded-full bg-eco-green text-white text-xs font-medium"
                    >Move to Cart</button>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(p.slug, p.name)}
                      className="px-3 py-2 rounded-full border text-xs hover:border-red-500 hover:text-red-500"
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
