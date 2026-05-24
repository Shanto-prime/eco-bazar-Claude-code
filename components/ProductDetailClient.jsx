"use client";

// components/ProductDetailClient.jsx
// Client island used by app/product/[slug]/page.js.
// - ProductGallery handles main image, thumbnails, and hover-zoom.
// - "See more / See less" toggles the description on mobile.
// - Quantity stepper + Add to Cart + wishlist toggle.
// - Tabs for Description / Additional Info / Customer Feedback.

import { useState } from "react";
import QuantityStepper from "./QuantityStepper";
import ProductGallery from "./ProductGallery";
import Stars from "./Stars";
import { useCart } from "../lib/CartContext";

const TABS = ["Description", "Additional Information", "Customer Feedback"];

const SHORT_DESC = "Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nulla nibh diam, blandit vel consequat nec.";
const FULL_DESC  = "Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nulla nibh diam, blandit vel consequat nec, ultrices et ipsum. Nulla varius magna a consequat pulvinar. Praesent fringilla mi at neque hendrerit aliquam. In ut lobortis ipsum, ut tincidunt ipsum. Vestibulum at sapien ut massa fringilla ullamcorper sit amet sit amet justo.";

export default function ProductDetailClient({ product }) {
  const [qty, setQty]       = useState(1);
  const [tab, setTab]       = useState(TABS[0]);
  const [showFull, setFull] = useState(false);
  const { addItem, toggleWishlist, wishlist, hydrated } = useCart();
  const inWishlist = hydrated && wishlist.includes(product.slug);

  return (
    <>
      {/* ============ Gallery + product info =============================== */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        <div>
          <ProductGallery images={product.images || []} alt={product.name} />
        </div>

        <div>
          <span className="inline-block bg-green-100 text-eco-green text-xs px-3 py-1 rounded-full">In Stock</span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-3">{product.name}</h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
            <Stars value={product.rating} />
            <span className="text-gray-500">4 Reviews</span>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <span className="text-gray-500">SKU: 2,51,594</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 border-b pb-5">
            <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
            {product.oldPrice && (
              <>
                <span className="text-gray-400 line-through">${product.oldPrice.toFixed(2)}</span>
                <span className="bg-eco-green text-white text-xs px-2 py-1 rounded">
                  {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% Off
                </span>
              </>
            )}
          </div>

          {/* Description with collapsible body --------------------------------- */}
          <div className="mt-4 text-gray-500 text-sm leading-relaxed">
            <p className="line-clamp-3 sm:line-clamp-none">
              {showFull ? FULL_DESC : SHORT_DESC}
            </p>
            <button
              type="button"
              onClick={() => setFull((s) => !s)}
              className="mt-2 text-eco-green text-sm font-medium sm:hidden"
            >
              {showFull ? "See less ↑" : "See more ↓"}
            </button>
          </div>

          <div className="text-sm mt-4">Brand: <span className="font-medium">Farmary</span></div>

          {/* Qty + Add to Cart + wishlist ------------------------------------ */}
          <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
            <QuantityStepper value={qty} onChange={setQty} />
            <button
              type="button"
              onClick={() => addItem(product, qty)}
              className="flex-1 min-w-[140px] py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600"
            >
              <i className="fa-solid fa-bag-shopping mr-2" /> Add to Cart
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product.slug, product.name)}
              className="w-12 h-12 rounded-full border border-gray-200 grid place-items-center hover:border-eco-green"
              aria-label="Add to wishlist"
            >
              <i className={`${inWishlist ? "fa-solid text-red-500" : "fa-regular"} fa-heart`} />
            </button>
          </div>

          <div className="mt-6 text-sm space-y-2">
            <div><span className="text-gray-500">Category:</span> Vegetables</div>
            <div><span className="text-gray-500">Tag:</span> Healthy, Organic, Fresh</div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Share:</span>
              <a href="#" className="hover:text-eco-green"><i className="fa-brands fa-facebook-f" /></a>
              <a href="#" className="hover:text-eco-green"><i className="fa-brands fa-twitter" /></a>
              <a href="#" className="hover:text-eco-green"><i className="fa-brands fa-pinterest" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Tabs ================================================= */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-2">
        <div className="pd-tabs overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t} type="button" onClick={() => setTab(t)}
              className={`pd-tab whitespace-nowrap ${tab === t ? "active" : ""}`}
            >{t}</button>
          ))}
        </div>
        <div className="py-6 text-sm text-gray-600 leading-relaxed">
          {tab === "Description" && (
            <>
              <p>{FULL_DESC}</p>
              <ul className="mt-4 space-y-2">
                {["100 g of fresh leaves provides essential nutrients.","Aliquam ac est at augue volutpat elementum.","Class aptent taciti sociosqu ad litora torquent per.","Fusce ullamcorper nisi ut diam congue."].map((t) => (
                  <li key={t} className="flex items-start gap-2"><i className="fa-solid fa-circle-check text-eco-green mt-0.5" /> {t}</li>
                ))}
              </ul>
            </>
          )}
          {tab === "Additional Information" && (
            <table className="w-full max-w-lg text-sm">
              <tbody>
                {[["Weight","500 g"],["Color","Green"],["Origin","USA"],["Organic","Yes"],["Best Before","5 days from delivery"]].map(([k,v]) => (
                  <tr key={k} className="border-b"><td className="py-2 font-medium">{k}</td><td className="py-2">{v}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "Customer Feedback" && (
            <div className="space-y-4">
              {[
                { name: "Robert Fox",   rating: 5, body: "Super fresh, well packaged. Will order again." },
                { name: "Eleanor Pena", rating: 4, body: "Good quality but delivery was a bit late." },
              ].map((r) => (
                <div key={r.name} className="border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 grid place-items-center">👤</div>
                    <div>
                      <div className="font-semibold text-gray-800">{r.name}</div>
                      <Stars value={r.rating} />
                    </div>
                  </div>
                  <p className="mt-2">{r.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
