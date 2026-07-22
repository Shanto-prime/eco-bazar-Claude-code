"use client";

// Store currency — ADMIN only. Store-wide (not a personal preference): the
// selected currency + rates decide what EVERY price on the site displays.
//
// Prices are stored in BDT (the base). Picking a display currency and its rate
// ("1 USD = X BDT") converts every amount at render time — see lib/currency.js.
// The page only renders this card for admins; the action re-checks the role.

import { useState, useTransition } from "react";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { CURRENCIES, CURRENCY_CODES, BASE_CURRENCY } from "../../../../lib/currency";
import { updateStoreCurrencyAction } from "../_actions";
import { Card, Field, Notice, SubmitButton } from "./ui";

export default function StoreCurrencySettings({ currency, rates }) {
  const t = useT();
  const [selected, setSelected] = useState(currency);
  const [result, setResult]     = useState(null);
  const [pending, start]        = useTransition();

  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    start(async () => setResult(await updateStoreCurrencyAction(formData)));
  };

  // Editable rate rows for every non-base currency.
  const rateCurrencies = CURRENCY_CODES.filter((c) => c !== BASE_CURRENCY);

  return (
    <Card id="currency" title={t("settings.storeCurrency")} description={t("settings.storeCurrencyHelp")}>
      <form onSubmit={onSubmit}>
        <Field label={t("settings.displayCurrency")} hint={t("settings.displayCurrencyHint")}>
          <select
            name="currency"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="eco-input rounded-xl"
          >
            {CURRENCY_CODES.map((code) => (
              <option key={code} value={code}>
                {CURRENCIES[code].symbol.trim()} · {code} — {CURRENCIES[code].label}
              </option>
            ))}
          </select>
        </Field>

        <div className="mt-5">
          <p className="text-[13px] font-medium">{t("settings.exchangeRates")}</p>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">
            {t("settings.exchangeRatesHint", { base: BASE_CURRENCY })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rateCurrencies.map((code) => (
              <Field key={code} label={t("settings.ratePerUnit", { code, base: BASE_CURRENCY })}>
                <div className="flex rounded-xl border border-gray-200 bg-white focus-within:border-eco-green overflow-hidden">
                  <span className="inline-flex items-center px-3 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 whitespace-nowrap">
                    1 {code} =
                  </span>
                  <input
                    name={`rate_${code}`}
                    type="number"
                    step="0.0001"
                    min="0"
                    required
                    defaultValue={rates?.[code] ?? CURRENCIES[code].defaultRate}
                    className="w-full px-3.5 py-2.5 text-sm bg-transparent focus:outline-none"
                  />
                  <span className="inline-flex items-center px-3 bg-gray-50 text-gray-400 text-sm border-l border-gray-200">
                    {BASE_CURRENCY}
                  </span>
                </div>
              </Field>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <SubmitButton pending={pending}>{t("settings.save")}</SubmitButton>
        </div>
        <Notice result={result} />
      </form>
    </Card>
  );
}
