"use client";

// lib/theme/ThemeProvider.jsx
// Light/dark theme state. Initialised from the cookie the server already read
// (passed as `initialTheme`) and applied to <html class="dark"> server-side, so
// there is no flash of the wrong theme on load. Toggling flips the <html> class,
// persists the choice to the cookie, and updates context — no reload needed.

import { createContext, useContext, useState, useCallback } from "react";
import { THEME_COOKIE } from "./config";

const ThemeContext = createContext(null);

export function ThemeProvider({ initialTheme = "light", children }) {
  const [theme, setTheme] = useState(initialTheme === "dark" ? "dark" : "light");

  const apply = useCallback((next) => {
    const value = next === "dark" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", value === "dark");
    document.cookie = `${THEME_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
    setTheme(value);
  }, []);

  const toggleTheme = useCallback(() => {
    apply(theme === "dark" ? "light" : "dark");
  }, [theme, apply]);

  const value = { theme, isDark: theme === "dark", setTheme: apply, toggleTheme };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
