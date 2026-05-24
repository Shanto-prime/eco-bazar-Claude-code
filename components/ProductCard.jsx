"use client";

// components/ProductCard.jsx — product tile used across Home, Shop, Product Detail.
// Clicking the card navigates to the product page; clicking the bag icon
// (Add to Cart) calls into CartContext without bubbling the click up.

import Link from "next/link";
import { useCart } from "../lib/CartContext";
import Stars from "./Stars";

export default function ProductCard({
  slug, name, icon, price, oldPrice, badge, rating = 4, featured = false,
  size = "md", // "md" = standard, "sm" = compact (hot deals strip)
}) {
  const { addItem, toggleWishlist, wishlist, hydrated } = useCart();
  const inWishlist = hydrated && wishlist.includes(slug);

  const imgClass = size === "sm" ? "h-32 text-6xl" : "h-40 text-7xl";

  const product = { slug, name, icon, price };

  return (
    <div className={`product-card relative border rounded-md p-3 bg-white ${featured ? "border-eco-green" : "border-gray-200"}`}>
      {badge && (
        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded z-10">{badge}</span>
      )}

      {/* Floating wishlist + quick-view buttons (visible on featured card) */}
      {featured && (
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button
            type="button"
            onClick={() => toggleWishlist(slug, name)}
            className="w-8 h-8 rounded-full bg-white shadow grid place-items-center"
            aria-label="Add to wishlist"
          >
            <i className={`${inWishlist ? "fa-solid text-red-500" : "fa-regular"} fa-heart text-xs`} />
          </button>
        </div>
      )}

      <Link href={`/product/${slug}`} className="block">
        <div className={`${imgClass} grid place-items-center`}>{icon}</div>
        <div className={`text-xs ${featured ? "text-eco-green font-medium" : "text-gray-500"}`}>{name}</div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <span className="font-semibold">${price.toFixed(2)}</span>
            {oldPrice && <span className="text-xs text-gray-400 line-through ml-1">${oldPrice.toFixed(2)}</span>}
          </div>
        </div>
        <Stars value={rating} className="text-xs mt-1" />
      </Link>

      {/* Add-to-cart bag is OUTSIDE the Link so its click doesn't navigate. */}
      <button
        type="button"
        onClick={() => addItem(product, 1)}
        className={`absolute bottom-9 right-3 w-8 h-8 rounded-full grid place-items-center ${
          featured ? "bg-eco-green text-white" : "add-btn bg-gray-100"
        }`}
        aria-label={`Add ${name} to cart`}
      >
        <i className="fa-solid fa-bag-shopping text-xs" />
      </button>
    </div>
  );
}
