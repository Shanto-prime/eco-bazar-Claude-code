"use client";

// components/LanguageToggle.jsx — English ⇄ বাংলা switcher for the top bar.
// Uses the shared LanguageProvider; switching writes the cookie and refreshes
// Server Components so the whole site (including product data) re-localizes.

import { useLanguage } from "../lib/i18n/LanguageProvider";
import { LOCALES, LOCALE_LABELS } from "../lib/i18n/config";

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-full border border-white/25 overflow-hidden text-[11px]">
      {LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          aria-pressed={locale === loc}
          className={`px-2 py-0.5 transition-colors ${
            locale === loc ? "bg-eco-green text-white" : "text-gray-300 hover:text-white"
          }`}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
