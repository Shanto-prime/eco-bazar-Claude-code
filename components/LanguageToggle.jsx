"use client";

// components/LanguageToggle.jsx — animated English ⇄ বাংলা switcher for the top bar.
//
// A compact two-segment pill with a sliding highlight (300ms ease-out). Sized
// h-7 to line up exactly with ThemeToggle and the other top-bar items — it never
// changes the bar height. Clicking a segment switches the whole site instantly
// (no reload): LanguageProvider persists the choice (localStorage + cookie) and
// refreshes Server Components so server-rendered copy re-localizes too.

import { useLanguage } from "../lib/i18n/LanguageProvider";
import { LOCALES, LOCALE_LABELS } from "../lib/i18n/config";

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  const isBangla = locale === "bn";

  return (
    <div
      role="group"
      aria-label="Language"
      className="relative inline-flex items-center h-7 rounded-full border border-white/25 bg-white/5 p-0.5 text-[11px] font-medium leading-none select-none"
    >
      {/* Sliding highlight — width is exactly one segment; translate-x-full lands
          it on the second segment, so it tracks the active language smoothly. */}
      <span
        aria-hidden="true"
        className={`absolute left-0.5 top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-eco-green shadow-sm transform transition-transform duration-300 ease-out ${
          isBangla ? "translate-x-full" : "translate-x-0"
        }`}
      />
      {LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          aria-pressed={locale === loc}
          className={`relative z-10 flex-1 basis-0 inline-flex items-center justify-center h-6 px-2.5 rounded-full transition-colors duration-300 whitespace-nowrap ${
            locale === loc ? "text-white" : "text-gray-300 hover:text-white"
          }`}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
