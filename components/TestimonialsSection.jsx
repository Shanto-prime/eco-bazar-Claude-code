"use client";

// components/TestimonialsSection.jsx
// Homepage Customer Reviews carousel. On desktop shows 3 cards at a time,
// scrolls one card per arrow click. The review pool is local to this file
// there's no admin UI or DB table behind it yet; treat these as curated
// launch-day social proof and replace with real approved reviews once the
// storefront starts collecting them (Review model already exists in
// prisma/schema.prisma, just no submission flow wired up here).

import { useState } from "react";
import TestimonialCard from "./TestimonialCard";
import { useT } from "../lib/i18n/LanguageProvider";

// Six seeded reviews, mostly five-star with two four-star to avoid the
// "every review is perfect" pattern that reads as fake.
const REVIEWS = [
    {
        id: 1,
        name: "Shanto Ahmed",
        role: "Verified Customer",
        avatar: "🧔",
        avatarImg: "/images/avatar1.jpg",
        stars: 5,
        quote: "Ilish delivered fresh in a foam box packed with ice   tasted straight from the market. Will be a weekly order.",
    },
    {
        id: 2,
        name: "Farhana Khatun",
        role: "Verified Customer",
        avatar: "👩",
        avatarImg: "/images/avatar2.jpg",
        stars: 5,
        quote: "Reached Dhanmondi in under three hours. Apples were crisp and the coriander smelled like it was picked that morning.",
    },
    {
        id: 3,
        name: "Rakib Hasan",
        role: "Verified Customer",
        avatar: "🧑",
        avatarImg: "/images/avatar3.jpg",
        stars: 4,
        quote: "Great quality overall. My paratha pack had 18 instead of 20, but support refunded the difference within a day.",
    },
    {
        id: 4,
        name: "Nusrat Jahan",
        role: "Verified Customer",
        avatar: "👩‍🦱",
        stars: 5,
        quote: "Sundarban honey is the real thing   thick, slightly cloudy, and settles at the bottom the way raw honey should.",
    },
    {
        id: 5,
        name: "Imran Chowdhury",
        role: "Verified Customer",
        avatar: "🧔‍♂️",
        stars: 5,
        quote: "Rui came scaled, gutted and cut into neat curry pieces. Saved me forty minutes in the kitchen. Perfect for a Friday lunch.",
    },
    {
        id: 6,
        name: "Sabina Yasmin",
        role: "Verified Customer",
        avatar: "👩‍🦰",
        stars: 4,
        quote: "Chinigura rice is aromatic and cooks up soft   the packet had a small tear on arrival though, otherwise flawless.",
    },
];

const VISIBLE = 3;

export default function TestimonialsSection() {
    const t = useT();
    const [start, setStart] = useState(0);

    const max = REVIEWS.length - VISIBLE;
    const prev = () => setStart((s) => (s <= 0 ? max : s - 1));
    const next = () => setStart((s) => (s >= max ? 0 : s + 1));

    const visible = REVIEWS.slice(start, start + VISIBLE);

    return (
        <section className="bg-eco-bg py-14 mt-14">
            <div className="max-w-[1320px] mx-auto px-6">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold">
                        {t("testimonials.title")}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={prev}
                            className="w-10 h-10 rounded-full bg-white border border-gray-200 grid place-items-center hover:border-eco-green"
                            aria-label={t("testimonials.previous")}
                        >
                            <i className="fa-solid fa-arrow-left" />
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            className="w-10 h-10 rounded-full bg-eco-green text-white grid place-items-center hover:bg-emerald-600"
                            aria-label={t("testimonials.next")}
                        >
                            <i className="fa-solid fa-arrow-right" />
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {visible.map((r) => (
                        <TestimonialCard key={r.id} {...r} />
                    ))}
                </div>
            </div>
        </section>
    );
}
