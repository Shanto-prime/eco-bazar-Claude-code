// lib/i18n/config.js
// Shared i18n constants (safe to import from both server and client code).

export const LOCALES = ["en", "bn"];
export const DEFAULT_LOCALE = "en";
export const LOCALE_COOKIE = "ecobazar-lang";

// Human labels for the language switcher.
export const LOCALE_LABELS = { en: "Eng", bn: "বাংলা" };

export function normalizeLocale(value) {
  return LOCALES.includes(value) ? value : DEFAULT_LOCALE;
}
