// app/register/page.jsx — Server entry for the credentials sign-up flow.

import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Create an account — Ecobazar" };

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
