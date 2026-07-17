"use client";

// app/forgot-password/ForgotPasswordForm.jsx
// Posts a username-or-email to /api/auth/forgot-password. The endpoint always
// replies generically, so the UI shows the same "check your inbox" message
// regardless of whether the account exists.

import { useState } from "react";
import Link from "next/link";
import { useT } from "../../lib/i18n/LanguageProvider";

export default function ForgotPasswordForm() {
  const t = useT();
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/auth/forgot-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ identifier }),
    }).catch(() => {});
    setBusy(false);
    setSent(true);
  };

  return (
    <section className="min-h-[70vh] grid place-items-center px-4 sm:px-6 py-10 sm:py-16 bg-eco-bg">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <i className="fa-solid fa-seedling text-eco-green text-3xl" />
          <span className="text-2xl font-bold text-eco-dark">{t("auth.brand")}</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold mb-1">{t("auth.forgotHeading")}</h1>
        <p className="text-sm text-gray-500 mb-5">
          {t("auth.forgotSub")}
        </p>

        {sent ? (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3">
            {t("auth.forgotSuccess", { identifier })}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500" htmlFor="identifier">{t("auth.usernameOrEmail")}</label>
              <input
                id="identifier" required autoComplete="username"
                value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                className="eco-input" placeholder={t("auth.forgotPlaceholder")}
              />
            </div>
            <button
              type="submit" disabled={busy}
              className="w-full py-3 rounded-md bg-eco-green text-white font-medium hover:bg-emerald-600 disabled:opacity-60 min-h-[44px]"
            >
              {busy ? t("auth.sending") : t("auth.sendResetLink")}
            </button>
          </form>
        )}

        <div className="text-sm text-center mt-6 text-gray-500">
          <Link href="/login" className="text-eco-green font-medium">{t("auth.backToLogin")}</Link>
        </div>
      </div>
    </section>
  );
}
