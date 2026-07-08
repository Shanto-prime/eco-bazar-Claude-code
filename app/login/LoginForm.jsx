"use client";

// app/login/LoginForm.jsx
// Credentials form + optional OAuth buttons (Google/Facebook).
// Buttons render only when the parent server component passes the matching
// hasX=true flag, which means the env vars are set.

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginForm({ hasGoogle, hasFacebook }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await signIn("credentials", {
      username, password,
      redirect: false,
    });
    setBusy(false);
    if (res?.error) {
      setError("Invalid username or password.");
      return;
    }
    router.push(next);
    router.refresh();
  };

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <section className="min-h-[70vh] grid place-items-center px-4 sm:px-6 py-10 sm:py-16 bg-eco-bg">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <i className="fa-solid fa-seedling text-eco-green text-3xl" />
          <span className="text-2xl font-bold text-eco-dark">Ecobazar</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold mb-1">Log in</h1>
        <p className="text-sm text-gray-500 mb-5">Welcome back — sign in to continue.</p>

        {isDev && (
          <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3">
            <div className="font-semibold mb-1">Dev test accounts (username / password):</div>
            <ul className="space-y-0.5 font-mono">
              <li>admin / admin</li>
              <li>mod / mod</li>
              <li>customer / customer</li>
            </ul>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500" htmlFor="username">Username or email</label>
            <input
              id="username" name="username" type="text" autoComplete="username"
              required value={username} onChange={(e) => setUsername(e.target.value)}
              className="eco-input" placeholder="admin"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500" htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password" autoComplete="current-password"
              required value={password} onChange={(e) => setPassword(e.target.value)}
              className="eco-input" placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={busy}
            className="w-full py-3 rounded-md bg-eco-green text-white font-medium hover:bg-emerald-600 disabled:opacity-60 min-h-[44px]"
          >
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>

        {(hasGoogle || hasFacebook) && (
          <>
            <div className="flex items-center gap-3 my-5 text-xs text-gray-400">
              <div className="flex-1 h-px bg-gray-200" /> OR <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-3">
              {hasGoogle && (
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: next })}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-md border border-gray-200 hover:border-eco-green transition min-h-[44px]"
                >
                  <i className="fa-brands fa-google text-lg" />
                  Continue with Google
                </button>
              )}
              {hasFacebook && (
                <button
                  type="button"
                  onClick={() => signIn("facebook", { callbackUrl: next })}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-md border border-gray-200 hover:border-eco-green transition min-h-[44px]"
                >
                  <i className="fa-brands fa-facebook-f text-lg text-[#1877f2]" />
                  Continue with Facebook
                </button>
              )}
            </div>
          </>
        )}

        <div className="text-sm text-center mt-6 text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-eco-green font-medium">Create one</Link>
        </div>
      </div>
    </section>
  );
}
