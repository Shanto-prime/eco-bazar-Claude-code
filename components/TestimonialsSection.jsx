"use client";

// components/TestimonialsSection.jsx
// Homepage testimonial slider with working prev/next arrows.
// On desktop shows 3 cards at a time, scrolls a single card per click.

import { useState } from "react";
import TestimonialCard from "./TestimonialCard";
import { testimonials } from "../lib/data";
import { useT } from "../lib/i18n/LanguageProvider";

// Loop the source data so the carousel always has something to show.
const cycle = (arr, n) => Array.from({ length: n }, (_, i) => arr[i % arr.length]);
const POOL  = cycle(testimonials, 6).map((t, i) => ({ ...t, id: `${t.id}-${i}` }));
const VISIBLE = 3;

export default function TestimonialsSection() {
  const t = useT();
  const [start, setStart] = useState(0);

  const max = POOL.length - VISIBLE;
  const prev = () => setStart((s) => (s <= 0 ? max : s - 1));
  const next = () => setStart((s) => (s >= max ? 0 : s + 1));

  const visible = POOL.slice(start, start + VISIBLE);

  return (
    <section className="bg-eco-bg py-14 mt-14">
      <div className="max-w-[1320px] mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">{t("testimonials.title")}</h2>
          <div className="flex gap-2">
            <button
              type="button" onClick={prev}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 grid place-items-center hover:border-eco-green"
              aria-label={t("testimonials.previous")}
            ><i className="fa-solid fa-arrow-left" /></button>
            <button
              type="button" onClick={next}
              className="w-10 h-10 rounded-full bg-eco-green text-white grid place-items-center hover:bg-emerald-600"
              aria-label={t("testimonials.next")}
            ><i className="fa-solid fa-arrow-right" /></button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visible.map((t) => <TestimonialCard key={t.id} {...t} />)}
        </div>
      </div>
    </section>
  );
}
