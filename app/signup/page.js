"use client";

// app/signup/page.js — Customer email+password sign-up.
// On success, automatically signs the user in and redirects home.

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      setError(error || "Sign-up failed.");
      setBusy(false);
      return;
    }
    // Auto sign-in.
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    router.push("/");
    router.refresh();
  };

  return (
    <section className="max-w-md mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold text-center">Create an account</h1>
      <p className="text-sm text-gray-500 text-center mt-2">Join Ecobazar — free, always.</p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div>
          <label className="text-xs text-gray-500">Full name</label>
          <input required value={form.name} onChange={set("name")} className="eco-input" placeholder="Your name" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Email</label>
          <input type="email" required value={form.email} onChange={set("email")} className="eco-input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Password (min 8 characters)</label>
          <input type="password" minLength={8} required value={form.password} onChange={set("password")} className="eco-input" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={busy} className="w-full py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600 disabled:opacity-60">
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="text-sm text-center mt-6 text-gray-500">
        Already have an account?{" "}
        <Link href="/signin" className="text-eco-green font-medium">Sign in</Link>
      </div>
    </section>
  );
}
