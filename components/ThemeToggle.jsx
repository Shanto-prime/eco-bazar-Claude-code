"use client";

// components/ThemeToggle.jsx — animated light/dark slider for the top bar.
// Light mode  → knob slides RIGHT, a yellow sun shows on the left.
// Dark mode   → knob slides LEFT,  a moon shows on the right.
// The knob, track color, and icons all animate (300ms).

import { useTheme } from "../lib/theme/ThemeProvider";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex items-center w-12 h-5 rounded-full transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-eco-green/50 ${
        isDark ? "bg-slate-700" : "bg-sky-300"
      }`}
    >
      {/* Sun — left side, yellow, visible in light mode */}
      <i
        className={`fa-solid fa-sun absolute left-2 text-[12px] text-yellow-400 transition-all duration-300 ${
          isDark ? "opacity-0 scale-50" : "opacity-100 scale-100"
        }`}
      />
      {/* Moon — right side, visible in dark mode */}
      <i
        className={`fa-solid fa-moon absolute right-2.5 text-[11px] text-slate-100 transition-all duration-300 ${
          isDark ? "opacity-100 scale-100" : "opacity-0 scale-50"
        }`}
      />
      {/* Sliding knob */}
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-out ${
          isDark ? "translate-x-0" : "translate-x-7"
        }`}
      />
    </button>
  );
}
