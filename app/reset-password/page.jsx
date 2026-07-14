// app/reset-password/page.jsx — server entry. The form reads ?token= via
// useSearchParams, so it's wrapped in Suspense (CSR bailout requirement).

import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata = { title: "Reset password — Ecobazar" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
