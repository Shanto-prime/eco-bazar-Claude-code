// lib/theme/server.js
// Server-side read of the theme cookie so the root layout can set
// <html class="dark"> before hydration (no flash of the wrong theme).

import "server-only";
import { cookies } from "next/headers";
import { THEME_COOKIE, normalizeTheme } from "./config";

export async function getTheme() {
  const store = await cookies();
  return normalizeTheme(store.get(THEME_COOKIE)?.value);
}
