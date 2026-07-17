// lib/i18n/config.js
// Shared i18n constants (safe to import from both server and client code).

export const LOCALES = ["en", "bn"];
export const DEFAULT_LOCALE = "en";
export const LOCALE_COOKIE = "ecobazar-lang";
// localStorage key used on the client to durably persist the chosen language.
// Kept in sync with LOCALE_COOKIE (cookie drives SSR; localStorage is the
// durable client store the app auto-loads from on refresh).
export const LOCALE_STORAGE_KEY = "ecobazar-lang";

// Human labels for the language switcher.
export const LOCALE_LABELS = { en: "EN", bn: "বাংলা" };

export function normalizeLocale(value) {
  return LOCALES.includes(value) ? value : DEFAULT_LOCALE;
}
