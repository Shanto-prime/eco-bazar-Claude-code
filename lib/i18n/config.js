// lib/i18n/config.js
// Shared i18n constants (safe to import from both server and client code).
//
// The store is English-only. LOCALES holds the single supported locale; the
// cookie/normalize helpers are kept so the plumbing stays uniform, but there is
// nothing to switch between. (Bangla was removed.)

export const LOCALES = ["en"];
export const DEFAULT_LOCALE = "en";
export const LOCALE_COOKIE = "ecobazar-lang";
export const LOCALE_STORAGE_KEY = "ecobazar-lang";

// Human labels (kept for symmetry; only one entry now).
export const LOCALE_LABELS = { en: "EN" };

// Any value collapses to the single supported locale.
export function normalizeLocale(value) {
  return LOCALES.includes(value) ? value : DEFAULT_LOCALE;
}
