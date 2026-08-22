// lib/offers.js
// Hot Deals offer rules   one place, because the same maths has to agree in four
// different contexts: the storefront cards, the product page, the admin form, and
// the authoritative price recompute at checkout. If any of those disagreed, a
// customer would be shown one price and charged another.
//
// Plain module (no Prisma, no "server-only") so the admin client form can import
// the percentage bounds and the preview maths too.

// Whole-percent bounds. The ceiling is deliberately below 100: a 100% offer would
// make the product free, which is never the intent of a sale badge and would let
// a mis-typed value give the catalogue away.
export const OFFER_MIN_PERCENT = 1;
export const OFFER_MAX_PERCENT = 90;

// How many products the Hot Deals area shows in total: the big featured card plus
// the small grid beside it. Live offers claim these slots first (soonest-ending in
// the big card); whatever is left is topped up with ordinary products.
export const HOT_DEALS_TOTAL_SLOTS = 9;

// An offer counts as live when it is switched on and its deadline hasn't passed.
// Pass `now` so a single request evaluates every offer against one timestamp
// (otherwise a page could sort by one clock and price by another).
export function isOfferLive(offer, now = Date.now()) {
    if (!offer?.active) return false;
    if (!offer.endsAt) return false;
    return new Date(offer.endsAt).getTime() > now;
}

// Soonest-ending first   the order the Hot Deals area is displayed in, and the
// reason `endsAt` is required on the model.
export function byEndingSoonest(a, b) {
    return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
}

// The live offer for a product, or null. Products carry `offers` as a list
// because expired rows are kept for history; only one may be live at a time
// (enforced in app/dashboard/offers/_actions.js), so the first live one wins.
export function liveOfferOf(product, now = Date.now()) {
    const offers = product?.offers;
    if (!Array.isArray(offers) || offers.length === 0) return null;
    return offers.find((o) => isOfferLive(o, now)) || null;
}

// Apply a percentage to an integer-minor-units price.
//
// Rounds to the nearest minor unit, and never returns less than 1   a rounded-to-
// zero price would make the item free, and `Product.price` is a non-zero amount
// by definition. Callers pass and receive integer cents (see lib/money.js).
export function discountedMinor(priceMinor, percentOff) {
    const pct = clampPercent(percentOff);
    return Math.max(1, Math.round((priceMinor * (100 - pct)) / 100));
}

export function clampPercent(percentOff) {
    const n = Math.round(Number(percentOff) || 0);
    if (n < OFFER_MIN_PERCENT) return OFFER_MIN_PERCENT;
    if (n > OFFER_MAX_PERCENT) return OFFER_MAX_PERCENT;
    return n;
}
