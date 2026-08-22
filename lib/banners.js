// lib/banners.js
// Shared, prisma-free banner constants + helpers. Safe to import from both
// client (the admin BannerForm) and server (storefront + landing page). DB
// queries live inline in the pages/actions that need them, so this module stays
// importable everywhere.
//
// Placement = which storefront promo area an IMAGE banner appears in:
//   TOP          top announcement / discount banner
//   BELOW_LIST   the advertisement below the product list
//
// HOT_DEALS is deliberately NOT here any more. That area is now driven by
// ProductOffer rows (a product + a percentage + a deadline) instead of uploaded
// artwork   see lib/offers.js and app/dashboard/offers/_actions.js. The enum
// value still exists in prisma/schema.prisma so banner rows created before the
// change remain readable, but the admin can no longer choose it and the
// storefront no longer renders it. `placementLabelKey` below keeps such legacy
// rows labelled in the admin list rather than showing a blank.
export const PLACEMENTS = [
    { key: "TOP", labelKey: "banners.placementTop" },
    { key: "BELOW_LIST", labelKey: "banners.placementBelowList" },
];

export const PLACEMENT_KEYS = PLACEMENTS.map((p) => p.key);

export const isValidPlacement = (k) => PLACEMENT_KEYS.includes(k);

// Label for any placement value found on an existing row, including retired ones.
export function placementLabelKey(key) {
    const known = PLACEMENTS.find((p) => p.key === key);
    if (known) return known.labelKey;
    if (key === "HOT_DEALS") return "banners.placementHotDealsLegacy";
    return "banners.placement";
}

// A banner is "live" on the storefront when it's active AND not past its
// deadline. Pass `now` (ms) so callers can be deterministic; defaults to real
// time. Accepts a deadline as Date | ISO string | null.
export function isBannerLive(banner, now = Date.now()) {
    if (!banner?.active) return false;
    if (!banner.deadline) return true;
    return new Date(banner.deadline).getTime() >= now;
}

export function isExpired(deadline, now = Date.now()) {
    return !!deadline && new Date(deadline).getTime() < now;
}

// Landing URL for a banner slug.
export const dealsHref = (slug) => `/deals/${slug}`;
