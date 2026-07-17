"use client";

// app/reset-password/ResetPasswordForm.jsx
// Reads the one-time token from ?token=, collects a new password (with
// confirmation), and posts to /api/auth/reset-password. On success it bounces
// to /login?reset=ok.

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useT } from "../../lib/i18n/LanguageProvider";

export default function ResetPasswordForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useT();
  const token = sp.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone]   = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError(t("auth.passwordsNoMatch")); return; }
    setBusy(true);
    const res = await fetch("/api/auth/reset-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      setError(error || t("auth.resetFailed"));
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login?reset=ok"), 1200);
  };

  return (
    <section className="min-h-[70vh] grid place-items-center px-4 sm:px-6 py-10 sm:py-16 bg-eco-bg">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <i className="fa-solid fa-seedling text-eco-green text-3xl" />
          <span className="text-2xl font-bold text-eco-dark">{t("auth.brand")}</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold mb-1">{t("auth.resetHeading")}</h1>

        {!token ? (
          <div className="mt-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            {t("auth.resetMissingToken").split("{link}")[0]}
            <Link href="/forgot-password" className="font-medium underline">{t("auth.resetForgotLink")}</Link>
            {t("auth.resetMissingToken").split("{link}")[1]}
          </div>
        ) : done ? (
          <div className="mt-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3">
            {t("auth.resetDone")}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">{t("auth.resetSub")}</p>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500" htmlFor="password">{t("auth.newPassword")}</label>
                <input
                  id="password" type="password" minLength={8} required autoComplete="new-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="eco-input" placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500" htmlFor="confirm">{t("auth.confirmPassword")}</label>
                <input
                  id="confirm" type="password" minLength={8} required autoComplete="new-password"
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="eco-input" placeholder="••••••••"
                />
              </div>
              <button
                type="submit" disabled={busy}
                className="w-full py-3 rounded-md bg-eco-green text-white font-medium hover:bg-emerald-600 disabled:opacity-60 min-h-[44px]"
              >
                {busy ? t("auth.updating") : t("auth.updatePassword")}
              </button>
            </form>
          </>
        )}

        <div className="text-sm text-center mt-6 text-gray-500">
          <Link href="/login" className="text-eco-green font-medium">{t("auth.backToLogin")}</Link>
        </div>
      </div>
    </section>
  );
}
