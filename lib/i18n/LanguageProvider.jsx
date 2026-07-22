"use client";

// lib/i18n/LanguageProvider.jsx
// Client-side translation access. The app is English-only, so this no longer
// switches languages or persists a choice — it just provides a bound `t()` and
// the (constant) locale to the ~60 components that call useT()/useLanguage().
// Kept as a provider so those call sites need no change, and so a future locale
// can be reintroduced here without touching consumers.

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, normalizeLocale } from "./config";
import { makeT } from "./translate";

const LanguageContext = createContext(null);

export function LanguageProvider({ initialLocale = DEFAULT_LOCALE, children }) {
  const locale = normalizeLocale(initialLocale); // always "en"

  const value = useMemo(
    () => ({
      locale,
      t: makeT(locale),
    }),
    [locale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Full language context (locale, t). */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

/** Ergonomic translator hook: `const t = useT();  t("nav.home")`. */
export function useT() {
  return useLanguage().t;
}

/** Just the active locale string. */
export function useLocale() {
  return useLanguage().locale;
}
