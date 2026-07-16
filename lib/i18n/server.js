// lib/i18n/server.js
// Server-side locale access. Reads the language cookie so Server Components
// (home, product pages, dashboard, TopBar) render in the active language.

import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale } from "./config";
import { makeT } from "./translate";

// Read the active locale from the cookie (defaults to English).
export async function getLocale() {
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
}

// Convenience: returns { locale, t } for a Server Component.
export async function getT() {
  const locale = await getLocale();
  return { locale, t: makeT(locale) };
}
