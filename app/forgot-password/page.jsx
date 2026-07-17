// app/forgot-password/page.jsx — server entry for the "forgot password" screen.

import { getT } from "../../lib/i18n/server";
import ForgotPasswordForm from "./ForgotPasswordForm";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("meta.forgotTitle") };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
