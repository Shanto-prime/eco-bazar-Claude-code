"use client";

// components/HomeHotDealsCard.jsx — the big featured Hot Deals card on the
// homepage: the running offer that ends soonest.
//
// Everything on it is admin-driven. `product` is a live offer's product, shaped
// by lib/products-db.js, so `price` is already the discounted price, `oldPrice`
// the original, and `offer` carries the percentage and the deadline the countdown
// runs to. app/page.js renders this card only when an offer is actually live, so
// there is no "no deal" state to design for here.
//
// Two things this replaced: the product used to come from lib/data.js (the static
// seed catalogue), so admin price edits never showed up; and the countdown ran to
// a date hardcoded in this file, which had already passed — the timer sat at
// 00:00:00:00 permanently.

import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "../lib/CartContext";
import { useT } from "../lib/i18n/LanguageProvider";
import { useMoney } from "../lib/currency/CurrencyProvider";

function diff(target) {
  const ms = Math.max(0, target - Date.now());
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms / 3600000) % 24);
  const m = Math.floor((ms / 60000)   % 60);
  const s = Math.floor((ms / 1000)    % 60);
  return [d, h, m, s].map((n) => String(n).padStart(2, "0"));
}

export default function HomeHotDealsCard({ product }) {
  const { addItem } = useCart();
  const t = useT();
  const money = useMoney();

  // The offer's deadline, resolved once so it can't drift between renders.
  const deadline = product?.offer?.endsAt || null;
  const [target] = useState(() => (deadline ? new Date(deadline).getTime() : null));

  // Starts null so the SERVER renders no countdown, and the first client render
  // matches it. Seeding this with diff(target) instead produced a genuine
  // hydration mismatch: diff() reads Date.now(), so the server rendered one
  // second and the browser rendered another moments later, and React threw
  // "server rendered text didn't match the client" and rebuilt the tree on every
  // homepage load. (It only became visible once seeded offers made the countdown
  // render at all.)
  //
  // A ticking clock is stale the instant it is serialised, so there is nothing to
  // gain from server-rendering it — the trade is a first paint without the timer.
  const [time, setTime] = useState(null);

  useEffect(() => {
    if (!target) return;
    setTime(diff(target)); // first real value, now that we're in the browser
    const id = setInterval(() => setTime(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!product) return null;

  // Only count down while there is time left. If the offer lapses with the page
  // still open, the timer disappears rather than freezing on a row of zeros.
  const showCountdown = Boolean(time) && time.some((n) => n !== "00");
  const percentOff = product.offer?.percentOff ?? null;

  return (
    <div className="bg-white border border-eco-green rounded-lg p-5">
      <div className="flex gap-2 mb-3">
        {/* The discount pill reflects the offer the admin actually set. */}
        {percentOff != null && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
            {t("hotDeals.salePercent", { percent: percentOff })}
          </span>
        )}
        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">{t("hotDeals.bestSale")}</span>
      </div>
      <div className="relative h-52">
        {/* The selected product's own image, falling back to the generic hot-deal
            artwork when it has none uploaded. */}
        <Image
          src={product.image || "/images/hotdeal-big.jpg"}
          alt={product.name}
          fill
          className="object-contain"
          sizes="(min-width:1024px) 33vw, 90vw"
        />
      </div>
      <button
        type="button"
        onClick={() => addItem(product, 1)}
        className="w-full mt-4 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600"
      >
        <i className="fa-solid fa-bag-shopping mr-2" /> {t("hotDeals.addToCart")}
      </button>
      <div className="text-center mt-4 text-eco-green font-semibold">{product.name}</div>
      <div className="text-center">
        <span className="font-bold">{money(product.price)}</span>
        {/* Struck-through compare-at price, only when the product actually has one. */}
        {product.oldPrice != null && (
          <span className="text-gray-400 line-through ml-1">{money(product.oldPrice)}</span>
        )}
      </div>
      <div className="text-yellow-400 text-center my-2">★★★★★ <span className="text-gray-500 text-xs">{t("hotDeals.feedback", { count: 524 })}</span></div>
      {showCountdown && (
        <>
          <div className="text-center text-xs text-gray-500 mb-2">{t("hotDeals.offerEnds")}</div>
          <div className="countdown justify-center">
            {[[t("hotDeals.days"), time[0]], [t("hotDeals.hours"), time[1]], [t("hotDeals.mins"), time[2]], [t("hotDeals.secs"), time[3]]].map(([lbl, num], i, arr) => (
              <span key={lbl} className="contents">
                <span className="unit"><div className="num">{num}</div><div className="lbl">{lbl}</div></span>
                {i < arr.length - 1 && <span className="sep">:</span>}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
