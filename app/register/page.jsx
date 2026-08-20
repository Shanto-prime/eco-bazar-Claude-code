// app/register/page.jsx — Server entry for the credentials sign-up flow.
// Blocks the form for already-signed-in visitors, same as /login (they should
// not see a "create account" prompt when they already have one).

import Link from "next/link";
import { Suspense } from "react";
import { getT } from "../../lib/i18n/server";
import { getCurrentUser } from "../../lib/auth-helpers";
import RegisterForm from "./RegisterForm";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("meta.registerTitle") };
}

export default async function RegisterPage() {
  const { t } = await getT();
  const user = await getCurrentUser();

  if (user) {
    return (
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 sm:py-20 min-h-[60vh] grid place-items-center">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-eco-green/10 text-eco-green grid place-items-center mb-5">
            <i className="fa-solid fa-user-check text-3xl sm:text-4xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-eco-dark mb-2">
            {t("unauthorized.alreadySignedIn", { name: user.name || user.email })}
          </h1>
          <p className="text-sm text-gray-500 mb-6 sm:mb-8">
            {t("unauthorized.signedInAs", { name: user.email, role: user.role })}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600 min-h-[44px]"
            >
              {t("unauthorized.goToDashboard")} <i className="fa-solid fa-arrow-right text-xs" />
            </Link>
            <Link
              href="/api/auth/signout"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-gray-200 text-gray-700 hover:border-eco-green hover:text-eco-green min-h-[44px]"
            >
              {t("unauthorized.signOut")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
