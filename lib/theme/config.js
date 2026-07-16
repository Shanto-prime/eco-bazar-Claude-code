// lib/theme/config.js
// Plain (non-client) constants shared by the client ThemeProvider and the
// server cookie reader — keeping them out of the "use client" module so the
// value survives the server/client boundary.

export const THEME_COOKIE = "ecobazar-theme";
export const THEMES = ["light", "dark"];

export function normalizeTheme(value) {
  return value === "dark" ? "dark" : "light";
}
