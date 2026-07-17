// app/register/page.jsx — Server entry for the credentials sign-up flow.

import { Suspense } from "react";
import { getT } from "../../lib/i18n/server";
import RegisterForm from "./RegisterForm";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("meta.registerTitle") };
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
