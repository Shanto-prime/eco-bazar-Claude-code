// lib/currency.js
// Pure currency config + conversion/formatting. No DB, no React — safe to import
// from anywhere (server components, client components, server actions).
//
// MODEL
//   • Every monetary amount in the DB is stored in the BASE currency's minor
//     units (see lib/money.js). The base currency is BDT — this store is
//     Bangladesh-based, so prices are Bangladeshi Taka.
//   • The admin picks an active DISPLAY currency and an exchange rate per
//     currency. Amounts are converted from BASE at render time; nothing in the
//     DB changes. A rate is "how many BASE units = 1 unit of that currency",
//     i.e. `rateToBase` — so 1 USD = 121 BDT means USD.rateToBase = 121.
//   • Convert: displayAmount = baseAmount / rateToBase. BASE itself has
//     rateToBase = 1, so BDT display is a no-op.

export const BASE_CURRENCY = "BDT";

// Static per-currency presentation + a sensible default rate the admin can edit.
// `defaultRate` = BASE (BDT) per 1 unit of the currency.
export const CURRENCIES = {
  BDT: { code: "BDT", label: "Bangladeshi Taka", symbol: "৳",    decimals: 2, position: "before", defaultRate: 1 },
  USD: { code: "USD", label: "US Dollar",        symbol: "$",    decimals: 2, position: "before", defaultRate: 121 },
  AED: { code: "AED", label: "UAE Dirham",       symbol: "AED ", decimals: 2, position: "before", defaultRate: 33 },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES);

// Default rates map (BASE per unit) for currencies other than the base.
export const DEFAULT_RATES = Object.fromEntries(
  CURRENCY_CODES.filter((c) => c !== BASE_CURRENCY).map((c) => [c, CURRENCIES[c].defaultRate]),
);

export function isValidCurrency(code) {
  return Object.prototype.hasOwnProperty.call(CURRENCIES, code);
}

// Merge the static config for `code` with the admin-supplied rates map, yielding
// the fully-resolved currency object the formatters take:
//   { code, label, symbol, decimals, position, rateToBase }
// The base currency is pinned at rateToBase = 1 regardless of what's stored.
export function resolveCurrency(code, rates = {}) {
  const base = CURRENCIES[isValidCurrency(code) ? code : BASE_CURRENCY];
  const rateToBase =
    base.code === BASE_CURRENCY
      ? 1
      : Number(rates?.[base.code]) > 0
        ? Number(rates[base.code])
        : base.defaultRate;
  return { ...base, rateToBase };
}

// baseMajor: an amount already in BASE major units (e.g. 14.99 BDT). Converts to
// the resolved currency and formats with its symbol/decimals.
export function formatBaseMajor(baseMajor, cur) {
  const c = cur && cur.symbol ? cur : resolveCurrency(BASE_CURRENCY);
  const value = Number(baseMajor || 0) / (c.rateToBase || 1);
  const num = value.toLocaleString("en-US", {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  });
  return c.position === "after" ? `${num} ${c.symbol.trim()}` : `${c.symbol}${num}`;
}

// baseMinor: an amount in BASE minor units (integer cents/poisha), the DB form.
export function formatBaseMinor(baseMinor, cur) {
  return formatBaseMajor(Number(baseMinor || 0) / 100, cur);
}
