"use client";

// lib/i18n/LanguageProvider.jsx
// Client-side language state. Initialised from the cookie value the server read
// (passed as `initialLocale`), so the first client render matches the server
// and there's no hydration flash.
//
// Switching language writes the cookie and calls router.refresh(), which
// re-renders all Server Components (product data, dashboard, etc.) in the new
// language while client components update from this context.

import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, DEFAULT_LOCALE, normalizeLocale } from "./config";
import { makeT } from "./translate";

const LanguageContext = createContext(null);

export function LanguageProvider({ initialLocale = DEFAULT_LOCALE, children }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(normalizeLocale(initialLocale));

  const setLocale = useCallback((next) => {
    const loc = normalizeLocale(next);
    // 1 year, site-wide.
    document.cookie = `${LOCALE_COOKIE}=${loc}; path=/; max-age=31536000; samesite=lax`;
    setLocaleState(loc);
    router.refresh(); // re-render Server Components in the new language
  }, [router]);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "bn" : "en");
  }, [locale, setLocale]);

  const value = { locale, setLocale, toggleLocale, t: makeT(locale) };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

// Ergonomic hook: const t = useT();  →  t("nav.home")
export function useT() {
  return useLanguage().t;
}
