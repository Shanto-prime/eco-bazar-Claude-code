"use client";

// Saved addresses. One is flagged default and prefills checkout — see
// app/checkout/page.js. Country/state come from lib/geo.js so the values here
// always match the <option>s checkout renders.

import { useState, useTransition } from "react";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { COUNTRIES, STATES } from "../../../../lib/geo";
import {
  createAddressAction, updateAddressAction,
  deleteAddressAction, setDefaultAddressAction,
} from "../_actions";
import { Card, Field, Notice, SubmitButton } from "./ui";

const EMPTY = {
  id: null, label: "", firstName: "", lastName: "", company: "",
  street: "", city: "", state: "", zip: "", country: "", phone: "", isDefault: false,
};

function AddressForm({ value, onCancel, onSubmit, pending, t }) {
  const editing = !!value.id;
  return (
    <form onSubmit={onSubmit} className="border border-gray-200 rounded-lg p-4 mt-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("settings.addrLabel")} hint={t("settings.addrLabelHint")}>
          <input name="label" className="eco-input" defaultValue={value.label || ""} maxLength={40} />
        </Field>
        <Field label={t("settings.phone")}>
          <input name="phone" type="tel" className="eco-input" defaultValue={value.phone || ""} maxLength={40} />
        </Field>
        <Field label={`${t("checkout.firstName")} *`}>
          <input name="firstName" className="eco-input" defaultValue={value.firstName} required maxLength={80} />
        </Field>
        <Field label={`${t("checkout.lastName")} *`}>
          <input name="lastName" className="eco-input" defaultValue={value.lastName} required maxLength={80} />
        </Field>
        <Field label={t("checkout.company")} wide>
          <input name="company" className="eco-input" defaultValue={value.company || ""} maxLength={120} />
        </Field>
        <Field label={`${t("checkout.street")} *`} wide>
          <input name="street" className="eco-input" defaultValue={value.street} required maxLength={200} />
        </Field>
        <Field label={t("settings.city")}>
          <input name="city" className="eco-input" defaultValue={value.city || ""} maxLength={80} />
        </Field>
        <Field label={t("checkout.zip")}>
          <input name="zip" className="eco-input" defaultValue={value.zip || ""} maxLength={20} />
        </Field>
        <Field label={t("checkout.country")}>
          <select name="country" className="eco-input" defaultValue={value.country || ""}>
            <option value="">{t("checkout.select")}</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label={t("checkout.state")}>
          <select name="state" className="eco-input" defaultValue={value.state || ""}>
            <option value="">{t("checkout.select")}</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm mt-4 cursor-pointer">
        <input type="checkbox" name="isDefault" className="eco-check" defaultChecked={value.isDefault} />
        {t("settings.makeDefault")}
      </label>

      <div className="flex flex-wrap gap-2 mt-4">
        <SubmitButton pending={pending}>
          {editing ? t("settings.saveAddress") : t("settings.addAddress")}
        </SubmitButton>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-full border border-gray-300 text-sm min-h-[44px]"
        >
          {t("settings.cancel")}
        </button>
      </div>
    </form>
  );
}

export default function AddressBook({ addresses }) {
  const t = useT();
  const [editing, setEditing] = useState(null); // null | EMPTY (new) | address (edit)
  const [result, setResult]   = useState(null);
  const [pending, start]      = useTransition();

  const run = (fn) => start(async () => {
    const res = await fn();
    setResult(res);
    if (res.ok) setEditing(null);
  });

  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    run(() => (editing.id ? updateAddressAction(editing.id, formData) : createAddressAction(formData)));
  };

  return (
    <Card title={t("settings.addresses")} description={t("settings.addressesHelp")}>
      {addresses.length === 0 && !editing && (
        <p className="text-sm text-gray-500">{t("settings.noAddresses")}</p>
      )}

      <ul className="space-y-3">
        {addresses.map((a) => (
          <li key={a.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{a.firstName} {a.lastName}</span>
                  {a.label && <span className="text-xs text-gray-500">({a.label})</span>}
                  {a.isDefault && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-eco-green text-white">
                      {t("settings.default")}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {[a.street, a.city, a.state, a.zip, a.country].filter(Boolean).join(", ")}
                </p>
                {a.phone && <p className="text-sm text-gray-500">{a.phone}</p>}
              </div>
              <div className="flex items-center gap-3 text-xs shrink-0">
                {!a.isDefault && (
                  <button
                    type="button"
                    onClick={() => run(() => setDefaultAddressAction(a.id))}
                    disabled={pending}
                    className="text-eco-green hover:underline disabled:opacity-50"
                  >
                    {t("settings.makeDefault")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setResult(null); setEditing(a); }}
                  className="text-gray-500 hover:underline"
                >
                  {t("settings.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(t("settings.confirmDeleteAddress"))) run(() => deleteAddressAction(a.id));
                  }}
                  disabled={pending}
                  className="text-red-500 hover:underline disabled:opacity-50"
                >
                  {t("settings.delete")}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editing ? (
        <AddressForm
          // Remount on target change so defaultValue picks up the new address
          // instead of keeping the previously-edited one's values.
          key={editing.id || "new"}
          value={editing}
          onCancel={() => setEditing(null)}
          onSubmit={onSubmit}
          pending={pending}
          t={t}
        />
      ) : (
        <button
          type="button"
          onClick={() => { setResult(null); setEditing(EMPTY); }}
          className="mt-3 px-5 py-2.5 rounded-full border border-eco-green text-eco-green text-sm font-medium min-h-[44px]"
        >
          <i className="fa-solid fa-plus mr-2" />{t("settings.addAddress")}
        </button>
      )}

      <Notice result={result} />
    </Card>
  );
}
