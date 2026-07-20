"use client";

// app/dashboard/settings/_components/AppearanceSettings.jsx
// Theme + language pickers for the settings page.
//
// Deliberately NOT reusing components/ThemeToggle + LanguageToggle: those are
// sized and coloured for the dark top bar (white/25 borders, gray-300 text) and
// read as invisible on a white card. Same state, different affordance — a
// settings page wants labelled options you can see the alternatives of, not a
// compact switch.
//
// Both writes are instant and self-persisting (cookie + <html> class for theme,
// cookie + localStorage + router.refresh() for locale), so there is no Save
// button and nothing to submit to the server.

import { useTheme } from "../../../../lib/theme/ThemeProvider";
import { useLanguage, useT } from "../../../../lib/i18n/LanguageProvider";
import { LOCALES } from "../../../../lib/i18n/config";

// Full language names for the settings page. LOCALE_LABELS ("EN" / "বাংলা") is
// the compact top-bar form; here there is room to spell it out. Each locale is
// written in its own script — a language picker you cannot read is useless.
const LOCALE_NAMES = { en: "English", bn: "বাংলা" };

function OptionCard({ selected, onClick, icon, title, subtitle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex-1 flex items-center gap-3 rounded-lg border p-4 text-left transition min-h-[44px] ${
        selected
          ? "border-eco-green ring-2 ring-eco-green/30 bg-eco-green/5"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <i className={`fa-solid ${icon} text-lg w-5 text-center ${selected ? "text-eco-green" : "text-gray-400"}`} />
      <span className="min-w-0">
        <span className="block text-sm font-medium truncate">{title}</span>
        {subtitle && <span className="block text-xs text-gray-500 truncate">{subtitle}</span>}
      </span>
      {selected && <i className="fa-solid fa-circle-check ml-auto text-eco-green" />}
    </button>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-sm text-gray-500 mt-0.5 mb-4">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3">{children}</div>
    </section>
  );
}

export default function AppearanceSettings() {
  const t = useT();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLanguage();

  return (
    <div className="space-y-5 max-w-2xl">
      <Section title={t("settings.theme")} description={t("settings.themeHelp")}>
        <OptionCard
          selected={theme === "light"}
          onClick={() => setTheme("light")}
          icon="fa-sun"
          title={t("settings.light")}
          subtitle={t("settings.lightHelp")}
        />
        <OptionCard
          selected={theme === "dark"}
          onClick={() => setTheme("dark")}
          icon="fa-moon"
          title={t("settings.dark")}
          subtitle={t("settings.darkHelp")}
        />
      </Section>

      <Section title={t("settings.language")} description={t("settings.languageHelp")}>
        {LOCALES.map((loc) => (
          <OptionCard
            key={loc}
            selected={locale === loc}
            onClick={() => setLocale(loc)}
            icon="fa-language"
            title={LOCALE_NAMES[loc] || loc}
            subtitle={loc.toUpperCase()}
          />
        ))}
      </Section>
    </div>
  );
}
