"use client";

// lib/currency/CurrencyProvider.jsx
// Makes the active display currency available to client components so prices
// convert + format consistently with the server-rendered ones.
//
// The resolved currency is read on the SERVER (lib/store-config getActiveCurrency)
// and passed in as `currency`. We deliberately do NOT copy it into local state:
// when the admin changes the currency, the action calls revalidatePath("/",
// "layout"), the server re-renders with the new `currency` prop, and it flows
// straight through this context — no reload, no stale useState.
//
// Client price values are in BASE major units (the cart/product data works in
// dollars-equivalent base units); `money()` converts+formats them. `moneyMinor`
// is the same for integer base minor units.

import { createContext, useContext, useMemo } from "react";
import { resolveCurrency, BASE_CURRENCY, formatBaseMajor, formatBaseMinor } from "../currency";

const CurrencyContext = createContext(null);

export function CurrencyProvider({ currency, children }) {
  // Fall back to a resolved base currency if a provider is mounted without one.
  const cur = currency && currency.symbol ? currency : resolveCurrency(BASE_CURRENCY);

  const value = useMemo(
    () => ({
      currency: cur,
      money:      (baseMajor) => formatBaseMajor(baseMajor, cur),
      moneyMinor: (baseMinor) => formatBaseMinor(baseMinor, cur),
    }),
    [cur],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return ctx;
}

// Ergonomic hook: `const money = useMoney(); money(14.99)` → "৳14.99" / "$0.12".
export function useMoney() {
  return useCurrency().money;
}
