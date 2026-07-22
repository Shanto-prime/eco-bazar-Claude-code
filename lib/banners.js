// lib/banners.js
// Shared, prisma-free banner constants + helpers. Safe to import from both
// client (the admin BannerForm) and server (storefront + landing page). DB
// queries live inline in the pages/actions that need them, so this module stays
// importable everywhere.
//
// Placement = which storefront promo area a banner appears in:
//   TOP        — top announcement / discount banner
//   BELOW_LIST — the advertisement below the product list
//   HOT_DEALS  — the hot deals promotion area

export const PLACEMENTS = [
  { key: "TOP",        labelKey: "banners.placementTop" },
  { key: "BELOW_LIST", labelKey: "banners.placementBelowList" },
  { key: "HOT_DEALS",  labelKey: "banners.placementHotDeals" },
];

export const PLACEMENT_KEYS = PLACEMENTS.map((p) => p.key);

export const isValidPlacement = (k) => PLACEMENT_KEYS.includes(k);

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
