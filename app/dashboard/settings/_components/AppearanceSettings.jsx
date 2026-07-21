"use client";

// Theme + language, as one "Preferences" card (components/settings.html layout).
// Both writes are instant and self-persisting (cookie + <html> class for theme;
// cookie + localStorage + router.refresh() for locale), so there is no Save
// button — clicking a choice card applies it.
//
// Selectable cards use bg-white / border-gray-200, which globals.css remaps for
// dark mode, so the selected/unselected states read correctly in both themes.

import { useTheme } from "../../../../lib/theme/ThemeProvider";
import { useLanguage, useT } from "../../../../lib/i18n/LanguageProvider";
import { LOCALES } from "../../../../lib/i18n/config";
import { Card } from "./ui";

const LOCALE_NAMES = { en: "English", bn: "বাংলা" };

function ChoiceCard({ selected, onClick, icon, iconClass, title, subtitle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative rounded-xl border p-4 text-left transition ${
        selected
          ? "border-eco-green ring-1 ring-eco-green bg-eco-green/5"
          : "border-gray-200 bg-white hover:border-eco-green/50"
      }`}
    >
      {selected && (
        <span className="absolute top-3 right-3 inline-flex items-center justify-center w-5 h-5 rounded-full bg-eco-green text-white text-[10px]">
          <i className="fa-solid fa-check" />
        </span>
      )}
      {icon && <i className={`fa-solid ${icon} text-lg ${iconClass}`} />}
      <p className={`text-sm font-semibold ${icon ? "mt-2" : ""}`}>{title}</p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </button>
  );
}

export default function AppearanceSettings() {
  const t = useT();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLanguage();

  return (
    <Card id="preferences" title={t("settings.preferences")} description={t("settings.preferencesHelp")}>
      <div className="space-y-6">
        <div>
          <p className="text-[13px] font-medium mb-2">{t("settings.theme")}</p>
          <div className="grid grid-cols-2 gap-3">
            <ChoiceCard
              selected={theme === "light"}
              onClick={() => setTheme("light")}
              icon="fa-sun" iconClass="text-amber-500"
              title={t("settings.light")} subtitle={t("settings.lightHelp")}
            />
            <ChoiceCard
              selected={theme === "dark"}
              onClick={() => setTheme("dark")}
              icon="fa-moon" iconClass="text-slate-500"
              title={t("settings.dark")} subtitle={t("settings.darkHelp")}
            />
          </div>
        </div>

        <div>
          <p className="text-[13px] font-medium mb-2">{t("settings.language")}</p>
          <div className="grid grid-cols-2 gap-3">
            {LOCALES.map((loc) => (
              <ChoiceCard
                key={loc}
                selected={locale === loc}
                onClick={() => setLocale(loc)}
                title={LOCALE_NAMES[loc] || loc}
                subtitle={loc.toUpperCase()}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
