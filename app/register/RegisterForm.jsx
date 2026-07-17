"use client";

// app/register/RegisterForm.jsx — credentials sign-up.
// Posts to /api/auth/signup, then auto-signs the new user in via Credentials.

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "../../lib/i18n/LanguageProvider";

export default function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useT();
  const next = sp.get("next") || "/dashboard";

  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", phone: "", image: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      setError(error || t("auth.signupFailed"));
      setBusy(false);
      return;
    }
    await signIn("credentials", {
      username: form.username, password: form.password,
      redirect: false,
    });
    router.push(next);
    router.refresh();
  };

  return (
    <section className="min-h-[70vh] grid place-items-center px-4 sm:px-6 py-10 sm:py-16 bg-eco-bg">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <i className="fa-solid fa-seedling text-eco-green text-3xl" />
          <span className="text-2xl font-bold text-eco-dark">{t("auth.brand")}</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold mb-1">{t("auth.registerTitle")}</h1>
        <p className="text-sm text-gray-500 mb-5">{t("auth.registerSub")}</p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500" htmlFor="name">{t("auth.fullName")}</label>
            <input
              id="name" required value={form.name} onChange={set("name")}
              autoComplete="name" className="eco-input" placeholder={t("auth.fullNamePh")}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500" htmlFor="username">{t("auth.username")}</label>
            <input
              id="username" required value={form.username} onChange={set("username")}
              autoComplete="username" className="eco-input" placeholder={t("auth.usernamePh")}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500" htmlFor="email">{t("checkout.email")}</label>
            <input
              id="email" type="email" required value={form.email} onChange={set("email")}
              autoComplete="email" className="eco-input" placeholder={t("auth.emailPh")}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500" htmlFor="password">{t("auth.passwordHint")}</label>
            <input
              id="password" type="password" minLength={8} required
              value={form.password} onChange={set("password")}
              autoComplete="new-password" className="eco-input" placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500" htmlFor="phone">{t("auth.phoneOptional")}</label>
            <input
              id="phone" type="tel" value={form.phone} onChange={set("phone")}
              autoComplete="tel" className="eco-input" placeholder={t("auth.phonePh")}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500" htmlFor="image">{t("auth.photoOptional")}</label>
            <input
              id="image" type="url" value={form.image} onChange={set("image")}
              className="eco-input" placeholder={t("auth.photoPh")}
            />
          </div>
          <button
            type="submit" disabled={busy}
            className="w-full py-3 rounded-md bg-eco-green text-white font-medium hover:bg-emerald-600 disabled:opacity-60 min-h-[44px]"
          >
            {busy ? t("auth.creating") : t("auth.createAccount")}
          </button>
        </form>

        <div className="text-sm text-center mt-6 text-gray-500">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="text-eco-green font-medium">{t("auth.login")}</Link>
        </div>
      </div>
    </section>
  );
}
