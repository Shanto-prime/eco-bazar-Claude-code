"use client";

// components/HomeHotDealsCard.jsx — the big featured Hot Deals card on the
// homepage. Has a live countdown timer and a working Add-to-Cart button.

import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "../lib/CartContext";
import { findProductBySlug } from "../lib/data";

// Fixed "offer ends" deadline: July 24th, 4:00 PM (local time).
// Month is 0-indexed, so 6 = July. Adjust the year here as needed.
const TARGET = () => new Date(2026, 6, 24, 16, 0, 0, 0).getTime();

function diff(target) {
  const ms = Math.max(0, target - Date.now());
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms / 3600000) % 24);
  const m = Math.floor((ms / 60000)   % 60);
  const s = Math.floor((ms / 1000)    % 60);
  return [d, h, m, s].map((n) => String(n).padStart(2, "0"));
}

export default function HomeHotDealsCard() {
  const { addItem } = useCart();
  const product = findProductBySlug("chinese-cabbage");

  // Lock the target after first render so it doesn't drift between renders.
  const [target] = useState(() => TARGET());
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="bg-white border border-eco-green rounded-lg p-5">
      <div className="flex gap-2 mb-3">
        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Sale 50%</span>
        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Best Sale</span>
      </div>
      <div className="relative h-52">
        <Image src="/images/hotdeal-big.jpg" alt={product.name} fill className="object-contain" sizes="(min-width:1024px) 33vw, 90vw" />
      </div>
      <button
        type="button"
        onClick={() => addItem(product, 1)}
        className="w-full mt-4 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600"
      >
        <i className="fa-solid fa-bag-shopping mr-2" /> Add to Cart
      </button>
      <div className="text-center mt-4 text-eco-green font-semibold">{product.name}</div>
      <div className="text-center"><span className="font-bold">${product.price.toFixed(2)}</span> <span className="text-gray-400 line-through ml-1">$24.00</span></div>
      <div className="text-yellow-400 text-center my-2">★★★★★ <span className="text-gray-500 text-xs">(524 Feedback)</span></div>
      <div className="text-center text-xs text-gray-500 mb-2">Hurry up! Offer ends in:</div>
      <div className="countdown justify-center">
        {[["DAYS", t[0]], ["HOURS", t[1]], ["MINS", t[2]], ["SECS", t[3]]].map(([lbl, num], i, arr) => (
          <span key={lbl} className="contents">
            <span className="unit"><div className="num">{num}</div><div className="lbl">{lbl}</div></span>
            {i < arr.length - 1 && <span className="sep">:</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
