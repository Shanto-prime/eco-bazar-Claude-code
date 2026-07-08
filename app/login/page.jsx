// app/login/page.jsx — Server entry. Reads OAuth env flags server-side and
// passes them as booleans to the client form, so empty OAuth envs => no
// "Continue with X" buttons rendered at all.

import { Suspense } from "react";
import { hasGoogle, hasFacebook } from "../../lib/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "Log in — Ecobazar" };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm hasGoogle={hasGoogle} hasFacebook={hasFacebook} />
    </Suspense>
  );
}
