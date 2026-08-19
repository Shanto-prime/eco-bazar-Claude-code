// components/TestimonialCard.jsx — one review shown in the Home "Customer
// Reviews" carousel. Accepts `stars` (0..5, half-stars not supported) and a
// review-specific `quote`; falls back sensibly when they're absent.

import Image from "next/image";

export default function TestimonialCard({ name, role, avatar, avatarImg, quote, stars = 5 }) {
  const full = Math.max(0, Math.min(5, Math.round(Number(stars) || 0)));
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-6">
      <div className="quote-mark" />
      <p className="text-sm text-gray-500">{quote}</p>
      <div className="flex items-center gap-3 mt-4">
        {avatarImg ? (
          <Image src={avatarImg} alt={name} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 grid place-items-center text-2xl">{avatar}</div>
        )}
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-gray-500">{role}</div>
        </div>
        <div className="ml-auto text-xs" aria-label={`${full} out of 5 stars`}>
          <span className="text-yellow-400">{"★".repeat(full)}</span>
          <span className="text-gray-300">{"★".repeat(5 - full)}</span>
        </div>
      </div>
    </div>
  );
}
