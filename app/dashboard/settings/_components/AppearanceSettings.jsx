"use client";

// Appearance — theme only. The app is English-only, so there is no language
// picker here anymore; the display currency is a store-wide ADMIN setting and
// lives in its own card (StoreCurrencySettings), not in personal preferences.
//
// Clicking a theme card applies instantly (cookie + <html> class), so there is
// no Save button. Cards use bg-white / border-gray-200, which globals.css remaps
// for dark mode, so the states read correctly in both themes.

import { useTheme } from "../../../../lib/theme/ThemeProvider";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { Card } from "./ui";

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

  return (
    <Card id="preferences" title={t("settings.appearance")} description={t("settings.appearanceHelp")}>
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
    </Card>
  );
}
