"use client";

// app/admin/login/page.js
// Dedicated admin login. Same providers as the customer site but redirects
// to /admin on success instead of /.

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminLogin() {
  const sp = useSearchParams();
  const next = sp.get("next") || "/admin";
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
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <i className="fa-solid fa-seedling text-eco-green text-3xl" />
          <span className="text-2xl font-bold">Ecobazar</span>
          <span className="ml-auto text-xs uppercase tracking-wider bg-eco-green text-white px-2 py-1 rounded">Admin</span>
        </div>

        <h1 className="text-xl font-bold mb-1">Sign in to the admin panel</h1>
        <p className="text-sm text-gray-500 mb-5">Use your admin or moderator account.</p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            {error === "CredentialsSignin" ? "Invalid email or password." : "Sign-in failed."}
          </div>
        )}

        <div className="space-y-3 mb-5">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: next })}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-md border border-gray-200 hover:border-eco-green transition"
          >
            <i className="fa-brands fa-google text-lg" />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => signIn("facebook", { callbackUrl: next })}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-md border border-gray-200 hover:border-eco-green transition"
          >
            <i className="fa-brands fa-facebook-f text-lg text-[#1877f2]" />
            Continue with Facebook
          </button>
        </div>

        <div className="flex items-center gap-3 my-4 text-xs text-gray-400">
          <div className="flex-1 h-px bg-gray-200" /> OR <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="eco-input" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="eco-input" />
          </div>
          <button type="submit" disabled={busy} className="w-full py-3 rounded-md bg-eco-green text-white font-medium hover:bg-emerald-600 disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
