"use client";

// app/signin/page.js — Customer sign-in page. Shows Google + Facebook +
// email/password forms. Used by both the customer site and (via a separate
// route) the admin login flow.

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const error = sp.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await signIn("credentials", { email, password, callbackUrl: next });
    setBusy(false);
  };

  return (
    <section className="max-w-md mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold text-center">Sign in</h1>
      <p className="text-sm text-gray-500 text-center mt-2">
        Welcome back — sign in to continue shopping.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error === "CredentialsSignin" ? "Invalid email or password." : "Sign-in failed. Please try again."}
        </div>
      )}

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: next })}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-full border border-gray-200 hover:border-eco-green transition"
        >
          <i className="fa-brands fa-google text-lg" />
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => signIn("facebook", { callbackUrl: next })}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-full border border-gray-200 hover:border-eco-green transition"
        >
          <i className="fa-brands fa-facebook-f text-lg text-[#1877f2]" />
          Continue with Facebook
        </button>
      </div>

      <div className="flex items-center gap-3 my-6 text-xs text-gray-400">
        <div className="flex-1 h-px bg-gray-200" /> OR <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-gray-500">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="eco-input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="eco-input" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={busy} className="w-full py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600 disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="text-sm text-center mt-6 text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-eco-green font-medium">Create one</Link>
      </div>
    </section>
  );
}
