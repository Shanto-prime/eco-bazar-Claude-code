// lib/money.js
// Single source of truth for the money representation boundary.
//
// The database stores every monetary amount as an INTEGER number of minor units
// (cents): 1499 == $14.99. This avoids the floating-point rounding bugs of
// storing dollars as Float, and MongoDB's Prisma connector has no Decimal type.
//
// Rule of thumb:
//   • DB + server-side authoritative math  → integer cents
//   • presentation / forms                 → dollars (a `number`), via these helpers
//
// Keep all cents↔dollars conversion here so the ratio lives in exactly one place.

import { formatBaseMinor, resolveCurrency, BASE_CURRENCY } from "./currency";

// Dollars (number|string from a form) → integer cents. Rounds to the nearest cent.
export function toCents(dollars) {
  return Math.round(Number(dollars) * 100);
}

// Integer cents → dollars as a Number (or null passthrough for optional fields).
export function toDollars(cents) {
  return cents == null ? null : cents / 100;
}

// Integer (BASE) minor units → a display string in the active currency, e.g.
// "৳14.99" / "$0.12". Pass the resolved currency from getActiveCurrency() in
// server components. Falls back to the base currency (BDT, no conversion) when
// none is supplied, so a missed call site degrades to the stored value rather
// than throwing.
export function formatMoney(baseMinor, cur = resolveCurrency(BASE_CURRENCY)) {
  return formatBaseMinor(baseMinor, cur);
}
