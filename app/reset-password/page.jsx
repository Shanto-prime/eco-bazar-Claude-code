// app/reset-password/page.jsx — server entry. The form reads ?token= via
// useSearchParams, so it's wrapped in Suspense (CSR bailout requirement).

import { Suspense } from "react";
import { getT } from "../../lib/i18n/server";
import ResetPasswordForm from "./ResetPasswordForm";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("meta.resetTitle") };
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
