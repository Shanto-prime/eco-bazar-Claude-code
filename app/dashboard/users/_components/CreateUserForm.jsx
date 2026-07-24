"use client";

// app/dashboard/users/_components/CreateUserForm.jsx
// ADMIN-only "create staff account" form. Creates a brand-new ADMIN or
// MODERATOR directly (customers self-register). Collapsible so it doesn't
// dominate the page.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { createUserAction } from "../_actions";

const EMPTY = { name: "", email: "", username: "", password: "", role: "MODERATOR" };

export default function CreateUserForm() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setError(null); setOk(false);
    startTransition(async () => {
      const res = await createUserAction(form);
      if (!res?.ok) { setError(res?.error || t("dashboard.userCreateFailed")); return; }
      setForm(EMPTY); setOk(true);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        type="button" onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-eco-green text-white text-sm font-medium px-4 py-2 hover:bg-emerald-600"
      >
        <i className="fa-solid fa-user-plus" /> {t("dashboard.createUser")}
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t("dashboard.createUser")}</h2>
        <button type="button" onClick={() => { setOpen(false); setError(null); }} className="text-gray-400 hover:text-gray-600" aria-label={t("dashboard.close")}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
      {ok && <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-2">{t("dashboard.userCreated")}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-gray-500">{t("dashboard.fieldName")}
          <input required value={form.name} onChange={set("name")} className="eco-input mt-1" />
        </label>
        <label className="text-xs text-gray-500">{t("dashboard.fieldEmail")}
          <input required type="email" value={form.email} onChange={set("email")} className="eco-input mt-1" />
        </label>
        <label className="text-xs text-gray-500">{t("dashboard.fieldUsername")}
          <input value={form.username} onChange={set("username")} className="eco-input mt-1" placeholder={t("dashboard.optional")} />
        </label>
        <label className="text-xs text-gray-500">{t("dashboard.fieldPassword")}
          <input required type="password" minLength={8} value={form.password} onChange={set("password")} className="eco-input mt-1" />
        </label>
        <label className="text-xs text-gray-500">{t("dashboard.fieldRole")}
          <select value={form.role} onChange={set("role")} className="eco-input mt-1">
            <option value="MODERATOR">{t("dashboard.roleModerator")}</option>
            <option value="ADMIN">{t("dashboard.roleAdmin")}</option>
          </select>
        </label>
      </div>

      <button type="submit" disabled={pending} className="rounded-md bg-eco-green text-white text-sm font-medium px-4 py-2 hover:bg-emerald-600 disabled:opacity-60">
        {pending ? t("dashboard.creating") : t("dashboard.createUser")}
      </button>
    </form>
  );
}
