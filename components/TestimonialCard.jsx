// components/TestimonialCard.jsx — single testimonial used in the Home "Client Testimonials" carousel.
import Image from "next/image";

export default function TestimonialCard({ name, role, avatar, avatarImg }) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-6">
      <div className="quote-mark" />
      <p className="text-sm text-gray-500">
        Pellentesque eu nibh eget mauris congue mattis mattis nec tellus. Phasellus imperdiet elit eu magna dictum, bibendum cursus velit sodales. Donec sed neque eget
      </p>
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
        <div className="ml-auto text-yellow-400 text-xs">★★★★★</div>
      </div>
    </div>
  );
}
