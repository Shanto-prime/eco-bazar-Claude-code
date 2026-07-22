// components/PromoBanners.jsx
// Renders the LIVE promo banners for a given placement as clickable images that
// link to their /deals/<slug> landing page. Server component: reads the banners
// straight from the DB. Renders nothing when a placement has no live banner, so
// it can be dropped into any storefront area without leaving an empty gap.
//
// Live = active AND not past its deadline (lib/banners isBannerLive) — this is
// how expired promos disappear from the storefront on their own.

import Link from "next/link";
import { prisma } from "../lib/prisma";
import { isBannerLive, dealsHref } from "../lib/banners";

export default async function PromoBanners({ placement, className = "", imgClassName = "" }) {
  const banners = await prisma.promoBanner.findMany({
    where:   { placement, active: true },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
  });

  const now = Date.now();
  const live = banners.filter((b) => isBannerLive(b, now));
  if (live.length === 0) return null;

  return (
    <div className={className}>
      {live.map((b) => (
        <Link
          key={b.id}
          href={dealsHref(b.slug)}
          className="block rounded-xl overflow-hidden hover:opacity-95 transition"
          aria-label={b.title}
        >
          {/* Plain <img>: uploaded banner files aren't in next.config
              images.remotePatterns, and next/image would reject them. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.imageUrl} alt={b.title} className={`w-full h-auto object-cover ${imgClassName}`} />
        </Link>
      ))}
    </div>
  );
}
