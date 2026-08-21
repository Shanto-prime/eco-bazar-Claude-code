// lib/store-config.js
// Server-side access to the single StoreConfig row. Kept as a shim so every
// caller (server pages that render money, the root layout that seeds the
// client provider, the admin write) keeps working without a code change.
//
// This project is BDT-only   there is no display-currency conversion any more.
// Both readers below return the base currency (BDT) unconditionally, ignoring
// whatever the DB row happens to hold. The multi-currency plumbing (rates,
// USD/AED presets, the CurrencyProvider swap) is dormant, not deleted   if
// a second currency is ever added back, only this file changes.
//
// The write (`saveStoreConfig`) is now a no-op; the admin currency section is
// removed from /dashboard/settings. It's kept exported so any old import site
// doesn't 500   swap to a real write again if you re-enable currencies.

import "server-only";
import { resolveCurrency, BASE_CURRENCY } from "./currency";

export async function getStoreConfig() {
    return { currency: BASE_CURRENCY, rates: {} };
}

// Fully-resolved active currency object the formatters take:
// { code, symbol, decimals, position, rateToBase }. Pinned to BDT.
export async function getActiveCurrency() {
    return resolveCurrency(BASE_CURRENCY, {});
}

// Retained for backwards compatibility with any leftover admin form binding.
// Silently accepts and does nothing.
export async function saveStoreConfig(_input) {
    return null;
}
