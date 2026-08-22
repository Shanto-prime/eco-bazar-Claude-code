// app/unauthorized/page.jsx
// Two audiences hit this page   the copy and CTAs branch on which one.
//
//   1. Anonymous visitor bounced by middleware.js when they hit a /dashboard/*
//      route. Fix: sign in.
//   2. Signed-in user whose role doesn't cover the route requireRole() sent
//      them to (e.g. a CUSTOMER trying /dashboard/products/[id]/edit).
//      Fix: nothing they can do   showing "sign in / create account" here
//      would be misleading (they ARE signed in). Show their role and offer
//      a way back to their own dashboard instead.

import Link from "next/link";
import { getT } from "../../lib/i18n/server";
import { getCurrentUser } from "../../lib/auth-helpers";

export async function generateMetadata() {
    const { t } = await getT();
    return { title: t("meta.unauthorizedTitle") };
}

export default async function UnauthorizedPage({ searchParams }) {
    const { t } = await getT();
    const sp = (await searchParams) || {};
    const next =
        typeof sp.next === "string" && sp.next.startsWith("/")
            ? sp.next
            : "/dashboard";
    const user = await getCurrentUser();
    const loginHref = `/login?next=${encodeURIComponent(next)}`;

    return (
        <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 sm:py-20 min-h-[60vh] grid place-items-center">
            <div className="w-full max-w-md text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-eco-green/10 text-eco-green grid place-items-center mb-5">
                    <i className="fa-solid fa-lock text-3xl sm:text-4xl" />
                </div>

                {user ? (
                    // Signed in, wrong role.
                    <>
                        <h1 className="text-2xl sm:text-3xl font-bold text-eco-dark mb-2">
                            {t("unauthorized.forbiddenHeading")}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 mb-2">
                            {t("unauthorized.forbiddenSubtitle")}
                        </p>
                        <p className="text-xs text-gray-500 mb-6 sm:mb-8">
                            {t("unauthorized.signedInAs", {
                                name: user.name || user.email,
                                role: user.role,
                            })}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600 min-h-[44px]"
                            >
                                {t("unauthorized.goToDashboard")}{" "}
                                <i className="fa-solid fa-arrow-right text-xs" />
                            </Link>
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-gray-200 text-gray-700 hover:border-eco-green hover:text-eco-green min-h-[44px]"
                            >
                                {t("unauthorized.backHome")}
                            </Link>
                        </div>
                    </>
                ) : (
                    // Anonymous visitor.
                    <>
                        <h1 className="text-2xl sm:text-3xl font-bold text-eco-dark mb-2">
                            {t("unauthorized.heading")}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">
                            {t("unauthorized.subtitle")}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href={loginHref}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600 min-h-[44px]"
                            >
                                {t("unauthorized.login")}{" "}
                                <i className="fa-solid fa-arrow-right text-xs" />
                            </Link>
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-gray-200 text-gray-700 hover:border-eco-green hover:text-eco-green min-h-[44px]"
                            >
                                {t("unauthorized.createAccount")}
                            </Link>
                        </div>

                        <Link
                            href="/"
                            className="block mt-8 text-sm text-gray-500 hover:text-eco-green"
                        >
                            {t("unauthorized.backHome")}
                        </Link>
                    </>
                )}
            </div>
        </section>
    );
}
