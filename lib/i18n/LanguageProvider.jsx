"use client";

// lib/i18n/LanguageProvider.jsx
// Client-side language state.
//
// Initialised from the value the SERVER read from the cookie (passed as
// `initialLocale`), so the first client render matches server-rendered HTML and
// there is no hydration flash.
//
// Persistence lives in lib/i18n/storage.js — the choice is written to BOTH
// localStorage (the durable client store the app auto-loads from) and a cookie
// (so Server Components can localize via next/headers). On mount we reconcile:
// if localStorage holds a different language than the server assumed (e.g. the
// cookie expired but localStorage survived), we adopt it and refresh the server
// tree so everything — client AND server components — switches with no reload.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, normalizeLocale } from "./config";
import { makeT } from "./translate";
import { readStoredLocale, persistLocale } from "./storage";

/**
 * @typedef {Object} LanguageContextValue
 * @property {"en"|"bn"} locale       Active locale.
 * @property {boolean}   isBangla     Convenience flag (locale === "bn").
 * @property {(next: "en"|"bn") => void} setLocale  Switch to a specific locale.
 * @property {() => void} toggleLocale Flip English ⇄ Bangla.
 * @property {(key: string, vars?: Record<string, unknown>) => string} t  Translator.
 */

/** @type {import("react").Context<LanguageContextValue|null>} */
const LanguageContext = createContext(null);

export function LanguageProvider({ initialLocale = DEFAULT_LOCALE, children }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(normalizeLocale(initialLocale));

  // Apply a locale: update state, persist (localStorage + cookie), and refresh
  // Server Components so DB-backed and server-rendered copy re-localizes live.
  const setLocale = useCallback(
    (next) => {
      const loc = normalizeLocale(next);
      persistLocale(loc);
      setLocaleState((prev) => {
        if (prev !== loc) router.refresh();
        return loc;
      });
    },
    [router]
  );

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "bn" : "en");
  }, [locale, setLocale]);

  // On mount, adopt the durable localStorage preference if it differs from what
  // the server rendered (cookie expired/cleared, or first visit after choosing).
  useEffect(() => {
    const stored = readStoredLocale(initialLocale);
    if (stored !== locale) {
      setLocale(stored);
    } else {
      // Ensure both stores exist even when nothing changed (first visit).
      persistLocale(stored);
    }
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      locale,
      isBangla: locale === "bn",
      setLocale,
      toggleLocale,
      t: makeT(locale),
    }),
    [locale, setLocale, toggleLocale]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

/** Full language context (locale, setters, t). */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

/** Ergonomic translator hook: `const t = useT();  t("nav.home")`. */
export function useT() {
  return useLanguage().t;
}

/** Just the active locale string: `const locale = useLocale();`. */
export function useLocale() {
  return useLanguage().locale;
}
