"use client";

// Saved addresses. One is flagged default and prefills checkout — see
// app/checkout/page.js. Country/state come from lib/geo.js so the values here
// always match the <option>s checkout renders.
//
// This is where the edit + delete pattern genuinely applies: addresses are a
// list, so each row carries Edit and Delete (and "Make default" when it isn't
// the default). Deleting the last address is allowed — unlike email, an account
// can have zero addresses.

import { useState, useTransition } from "react";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { COUNTRIES, STATES } from "../../../../lib/geo";
import {
  createAddressAction, updateAddressAction,
  deleteAddressAction, setDefaultAddressAction,
} from "../_actions";
import { Card, Field, Notice, SubmitButton, GhostButton } from "./ui";

const EMPTY = {
  id: null, label: "", firstName: "", lastName: "", company: "",
  street: "", city: "", state: "", zip: "", country: "", phone: "", isDefault: false,
};

function AddressForm({ value, onCancel, onSubmit, pending, t }) {
  const editing = !!value.id;
  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-gray-200 p-4 mt-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("settings.addrLabel")} hint={t("settings.addrLabelHint")}>
          <input name="label" className="eco-input rounded-xl" defaultValue={value.label || ""} maxLength={40} />
        </Field>
        <Field label={t("settings.phone")}>
          <input name="phone" type="tel" className="eco-input rounded-xl" defaultValue={value.phone || ""} maxLength={40} />
        </Field>
        <Field label={t("checkout.firstName")} required>
          <input name="firstName" className="eco-input rounded-xl" defaultValue={value.firstName} required maxLength={80} />
        </Field>
        <Field label={t("checkout.lastName")} required>
          <input name="lastName" className="eco-input rounded-xl" defaultValue={value.lastName} required maxLength={80} />
        </Field>
        <Field label={t("checkout.company")} wide>
          <input name="company" className="eco-input rounded-xl" defaultValue={value.company || ""} maxLength={120} />
        </Field>
        <Field label={t("checkout.street")} required wide>
          <input name="street" className="eco-input rounded-xl" defaultValue={value.street} required maxLength={200} />
        </Field>
        <Field label={t("settings.city")}>
          <input name="city" className="eco-input rounded-xl" defaultValue={value.city || ""} maxLength={80} />
        </Field>
        <Field label={t("checkout.zip")}>
          <input name="zip" className="eco-input rounded-xl" defaultValue={value.zip || ""} maxLength={20} />
        </Field>
        <Field label={t("checkout.country")}>
          <select name="country" className="eco-input rounded-xl" defaultValue={value.country || ""}>
            <option value="">{t("checkout.select")}</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label={t("checkout.state")}>
          <select name="state" className="eco-input rounded-xl" defaultValue={value.state || ""}>
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
        <GhostButton onClick={onCancel}>{t("settings.cancel")}</GhostButton>
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

  const empty = addresses.length === 0;

  return (
    <Card id="addresses" title={t("settings.addresses")} description={t("settings.addressesHelp")}>
      {empty && !editing ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
          <span className="mx-auto inline-flex items-center justify-center w-11 h-11 rounded-full bg-eco-green/10 text-eco-green">
            <i className="fa-solid fa-location-dot" />
          </span>
          <p className="mt-3 text-sm font-medium">{t("settings.noAddresses")}</p>
          <p className="mt-0.5 text-xs text-gray-400">{t("settings.noAddressesHint")}</p>
          <GhostButton onClick={() => { setResult(null); setEditing(EMPTY); }} className="mt-4 text-eco-green">
            <i className="fa-solid fa-plus text-xs" />{t("settings.addAddress")}
          </GhostButton>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {addresses.map((a) => (
              <li key={a.id} className="rounded-xl border border-gray-200 p-4">
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
              // Remount on target change so defaultValue picks up the new address.
              key={editing.id || "new"}
              value={editing}
              onCancel={() => setEditing(null)}
              onSubmit={onSubmit}
              pending={pending}
              t={t}
            />
          ) : (
            <GhostButton
              onClick={() => { setResult(null); setEditing(EMPTY); }}
              className="mt-3 text-eco-green"
            >
              <i className="fa-solid fa-plus text-xs" />{t("settings.addAddress")}
            </GhostButton>
          )}
        </>
      )}

      <Notice result={result} />
    </Card>
  );
}
