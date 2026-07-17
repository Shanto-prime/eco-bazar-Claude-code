"use client";

// lib/i18n/storage.js
// Client-only persistence for the active locale.
//
// The locale is persisted in TWO places, on purpose:
//   1. localStorage — the durable client store (survives refresh; read on mount
//      to auto-load the previously selected language, per product requirement).
//   2. a cookie      — so Server Components (layout, TopBar, /shop, product
//      pages) can read the locale via next/headers and render server-side in the
//      right language with NO hydration flash. localStorage is unreadable on the
//      server, so the cookie is what makes SSR localization possible.
//
// Both are written together and kept in sync, so they never diverge in practice.
// This module is safe to import from client code only (it touches window/document).

import { LOCALE_COOKIE, LOCALE_STORAGE_KEY, normalizeLocale } from "./config";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Read the persisted locale on the client.
 * Prefers localStorage (the durable store); falls back to the cookie.
 * @param {string} [fallback] locale to use when nothing is persisted yet
 * @returns {"en"|"bn"}
 */
export function readStoredLocale(fallback) {
  if (typeof window === "undefined") return normalizeLocale(fallback);

  // 1. localStorage — the source the requirement asks us to load from.
  try {
    const fromLS = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (fromLS) return normalizeLocale(fromLS);
  } catch {
    /* localStorage can throw in private mode / when disabled — ignore */
  }

  // 2. cookie fallback (e.g. localStorage cleared but cookie survived).
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`)
  );
  if (match) return normalizeLocale(decodeURIComponent(match[1]));

  return normalizeLocale(fallback);
}

/**
 * Persist the locale to BOTH localStorage and the cookie.
 * @param {"en"|"bn"} locale
 */
export function persistLocale(locale) {
  if (typeof window === "undefined") return;
  const loc = normalizeLocale(locale);

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, loc);
  } catch {
    /* ignore storage failures */
  }

  document.cookie = `${LOCALE_COOKIE}=${loc}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}
